#!/usr/bin/env python3
"""Distribute exact EMS and Cargo registry sources; not an image compliance receipt."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import tarfile
import tomllib


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args])


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend', type=Path, required=True)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--integration', type=Path,
                        default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--integration-commit', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--cargo-home', type=Path,
                        default=Path(os.environ.get('CARGO_HOME', Path.home() / '.cargo')))
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}', args.commit):
        parser.error('--commit requires a full lowercase Git OID')
    resolved = git(args.backend, 'rev-parse', args.commit + '^{commit}').decode().strip()
    if resolved != args.commit:
        parser.error('commit did not resolve exactly')
    if not re.fullmatch(r'[0-9a-f]{40}', args.integration_commit):
        parser.error('--integration-commit requires a full lowercase Git OID')
    resolved_integration = git(args.integration, 'rev-parse', args.integration_commit + '^{commit}').decode().strip()
    if resolved_integration != args.integration_commit:
        parser.error('integration commit did not resolve exactly')
    if args.output.exists():
        parser.error('output must not exist; never overwrite a distribution')
    lock_bytes = git(args.backend, 'show', args.commit + ':Cargo.lock')
    lock = tomllib.loads(lock_bytes.decode())
    sources = []
    for package in lock['package']:
        source = package.get('source')
        if source is None:
            continue
        if source != 'registry+https://github.com/rust-lang/crates.io-index':
            raise ValueError(f'Unsupported source requires explicit provenance: {source}')
        filename = f"{package['name']}-{package['version']}.crate"
        checksum = package['checksum']
        candidates = sorted((args.cargo_home / 'registry' / 'cache').glob('*/' + filename))
        verified = next((path for path in candidates if sha256(path.read_bytes()) == checksum), None)
        if verified is None:
            raise ValueError(f'Missing or checksum-mismatched locked archive: {filename}')
        data = verified.read_bytes()
        notices = []
        with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
            root = f"{package['name']}-{package['version']}/"
            cargo = tomllib.loads(archive.extractfile(root + 'Cargo.toml').read().decode())['package']
            for member in archive.getmembers():
                if member.isfile() and re.search(r'(license|copying|notice|copyright|authors)', member.name, re.I):
                    content = archive.extractfile(member).read()
                    notices.append({'path': member.name, 'sha256': sha256(content)})
        sources.append((filename, data, {
            'name': package['name'], 'version': package['version'],
            'source': source, 'sha256': checksum, 'archive': 'crates/' + filename,
            'license': cargo.get('license'), 'licenseFile': cargo.get('license-file'),
            'repository': cargo.get('repository'), 'noticeFiles': notices,
        }))
    ems = git(args.backend, 'archive', '--format=tar', '--prefix=ems/', args.commit)
    tooling_paths = ['docker', 'scripts', 'docs', 'compose.yaml', 'release.yaml',
                     'README.md', 'LICENSE', '.gitmodules']
    tooling = git(args.integration, 'archive', '--format=tar', '--prefix=integration/',
                  args.integration_commit, *tooling_paths)
    tooling_files = []
    with tarfile.open(fileobj=io.BytesIO(tooling), mode='r:') as archive:
        for member in archive.getmembers():
            if member.isdir():
                continue
            if not member.isfile():
                raise ValueError('Integration build sources must not contain symbolic or special files')
            content = archive.extractfile(member).read()
            tooling_files.append({'path': member.name, 'sha256': sha256(content)})
    manifest = {
        'format': 2, 'backendCommit': args.commit,
        'integrationCommit': args.integration_commit,
        'integrationArchive': {'path': 'integration-source.tar', 'sha256': sha256(tooling),
                               'files': tooling_files},
        'cargoLockSha256': sha256(lock_bytes),
        'emsArchive': {'path': 'ems-source.tar', 'sha256': sha256(ems)},
        'packages': [entry for _, _, entry in sources],
        'limitations': [
            'Registry sources are the actual locked published archives, including dirty upstream publications.',
            'No claim of complete notice, license-election, external toolchain or image compliance.',
            'Base image native packages, frontend sources and brand rights require separate distribution and review.',
        ],
    }
    mpl = git(args.integration, 'show', args.integration_commit + ':docker/licenses/webauthn-MPL-2.0.txt')
    mpl_checksum = '32ee9dbf6196874fc9d406c54a888a6c4cbb9aa4a7f35b46befeaff43a78fe85'
    if sha256(mpl) != mpl_checksum:
        raise ValueError('Pinned WebAuthn MPL license text checksum mismatch')
    manifest['supplementalLicenses'] = [{
        'path': 'licenses/webauthn-MPL-2.0.txt', 'sha256': mpl_checksum,
        'source': 'https://raw.githubusercontent.com/kanidm/webauthn-rs/d2c10d53ca5ef033d37ee6462e936e9eb72ad98c/LICENSE.md',
        'appliesTo': [entry['name'] for _, _, entry in sources if entry['license'] == 'MPL-2.0'],
    }]
    supplemental = json.loads(git(args.integration, 'show',
                                  args.integration_commit + ':docker/licenses/registry-manifest.json'))
    locked_versions = {(entry['name'], entry['version']) for _, _, entry in sources}
    supplemental_bytes = []
    for record in supplemental['licenses']:
        matching = [package for package in record['packages']
                    if (package['name'], package['version']) in locked_versions]
        if not matching:
            continue
        local_path = Path(record['path'])
        if local_path.is_absolute() or '..' in local_path.parts:
            raise ValueError('Supplemental license path must remain inside integration sources')
        data = git(args.integration, 'show', args.integration_commit + ':' + local_path.as_posix())
        if sha256(data) != record['sha256']:
            raise ValueError(f"Supplemental license checksum mismatch: {record['path']}")
        target = 'licenses/' + local_path.name
        manifest['supplementalLicenses'].append({**record, 'path': target, 'packages': matching})
        supplemental_bytes.append((target, data))
    args.output.mkdir(parents=True)
    (args.output / 'crates').mkdir()
    (args.output / 'ems-source.tar').write_bytes(ems)
    (args.output / 'integration-source.tar').write_bytes(tooling)
    instructions = (
        'EMS exact source distribution\n'
        '=============================\n\n'
        f'Backend commit: {args.commit}\nIntegration commit: {args.integration_commit}\n\n'
        'This entire directory must accompany the executable distribution. Keep the\n'
        'crates/ and licenses/ directories available to recipients, not only this file.\n'
        'manifest.json records exact archive hashes, versions and preserved notice paths.\n\n'
        'Unpack ems-source.tar and integration-source.tar into one working directory.\n'
        'The backend source includes Cargo.lock and its declared Rust MSRV. Build with\n'
        '`cargo build --release --workspace --locked` from ems/. The unchanged locked\n'
        'crate archives are in crates/; populate a private Cargo registry cache with\n'
        'these exact files or obtain the checksum-identical registry files before an\n'
        'offline build. Compiler, system libraries and base images are separate inputs.\n\n'
        'Integration-controlled Dockerfiles, Compose, scripts and operating instructions\n'
        'are in integration/. For a backend Docker build, use ems/ as the build context\n'
        'and integration/docker/backend.Dockerfile as the Dockerfile. Compose expects\n'
        'the exact child paths declared in integration/.gitmodules; a complete full-stack\n'
        'build additionally requires the corresponding exact frontend source archive.\n'
        'Read integration/docs/local-development.md for runtime settings and startup.\n'
        'Provide deployment secrets privately; no credentials are supplied by this bundle.\n\n'
        'License declarations and available notices are inventoried, not legal clearance.\n'
        'Conveyed native/base-image software, supplemental missing grants and brand rights\n'
        'must be reviewed separately. Do not substitute clean upstream checkouts for\n'
        'dirty published crate sources: their exact locked archives are supplied here.\n'
    ).encode()
    (args.output / 'SOURCE-INSTRUCTIONS.txt').write_bytes(instructions)
    manifest['sourceInstructions'] = {'path': 'SOURCE-INSTRUCTIONS.txt', 'sha256': sha256(instructions)}
    (args.output / 'licenses').mkdir()
    (args.output / 'licenses' / 'webauthn-MPL-2.0.txt').write_bytes(mpl)
    for target, data in supplemental_bytes:
        (args.output / target).write_bytes(data)
    for filename, data, _ in sources:
        (args.output / 'crates' / filename).write_bytes(data)
    (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'backendCommit': args.commit, 'registryArchives': len(sources),
                      'output': str(args.output), 'emsArchiveSha256': sha256(ems)}))


if __name__ == '__main__':
    main()
