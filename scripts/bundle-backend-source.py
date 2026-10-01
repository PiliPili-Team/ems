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
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--cargo-home', type=Path,
                        default=Path(os.environ.get('CARGO_HOME', Path.home() / '.cargo')))
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}', args.commit):
        parser.error('--commit requires a full lowercase Git OID')
    resolved = git(args.backend, 'rev-parse', args.commit + '^{commit}').decode().strip()
    if resolved != args.commit:
        parser.error('commit did not resolve exactly')
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
                if member.isfile() and re.search(r'(license|copying|notice|copyright)', member.name, re.I):
                    content = archive.extractfile(member).read()
                    notices.append({'path': member.name, 'sha256': sha256(content)})
        sources.append((filename, data, {
            'name': package['name'], 'version': package['version'],
            'source': source, 'sha256': checksum, 'archive': 'crates/' + filename,
            'license': cargo.get('license'), 'licenseFile': cargo.get('license-file'),
            'repository': cargo.get('repository'), 'noticeFiles': notices,
        }))
    ems = git(args.backend, 'archive', '--format=tar', '--prefix=ems/', args.commit)
    manifest = {
        'format': 1, 'backendCommit': args.commit,
        'cargoLockSha256': sha256(lock_bytes),
        'emsArchive': {'path': 'ems-source.tar', 'sha256': sha256(ems)},
        'packages': [entry for _, _, entry in sources],
        'limitations': [
            'Registry sources are the actual locked published archives, including dirty upstream publications.',
            'No claim of complete notice, license-election, corresponding build tooling or image compliance.',
            'Base image native packages, frontend sources and brand rights require separate distribution and review.',
        ],
    }
    mpl_path = Path(__file__).resolve().parent.parent / 'docker/licenses/webauthn-MPL-2.0.txt'
    mpl = mpl_path.read_bytes()
    mpl_checksum = '32ee9dbf6196874fc9d406c54a888a6c4cbb9aa4a7f35b46befeaff43a78fe85'
    if sha256(mpl) != mpl_checksum:
        raise ValueError('Pinned WebAuthn MPL license text checksum mismatch')
    manifest['supplementalLicenses'] = [{
        'path': 'licenses/webauthn-MPL-2.0.txt', 'sha256': mpl_checksum,
        'source': 'https://raw.githubusercontent.com/kanidm/webauthn-rs/d2c10d53ca5ef033d37ee6462e936e9eb72ad98c/LICENSE.md',
        'appliesTo': [entry['name'] for _, _, entry in sources if entry['license'] == 'MPL-2.0'],
    }]
    args.output.mkdir(parents=True)
    (args.output / 'crates').mkdir()
    (args.output / 'ems-source.tar').write_bytes(ems)
    (args.output / 'licenses').mkdir()
    (args.output / 'licenses' / 'webauthn-MPL-2.0.txt').write_bytes(mpl)
    for filename, data, _ in sources:
        (args.output / 'crates' / filename).write_bytes(data)
    (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'backendCommit': args.commit, 'registryArchives': len(sources),
                      'output': str(args.output), 'emsArchiveSha256': sha256(ems)}))


if __name__ == '__main__':
    main()
