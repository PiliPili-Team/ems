# Host File Management

The file manager at `/filemanager` browses the file system of the machine that runs
the EMS service: a Windows or macOS host, a Linux server, or the inside of a Docker
container. It has a backend API under `/api/v1/admin/files` (operations E250-E254).

## Who can do what

| Capability | Permission | Roles |
| --- | --- | --- |
| Browse, download | `admin.files.read` | admin, super admin |
| New folder, rename, delete | `super.files.write` | super admin only |

Both permissions are session-only: API keys cannot use these endpoints. Every
mutation is written to the audit log **before** it runs, so no audit record means no
change. Audit records hold the action and recursive flag, not paths.

## Protection model

All paths are resolved through symbolic links first, then checked, so a link cannot
reach a protected place.

* **Rejected input**: relative paths, `.`/`..` segments, NUL and control characters,
  over-long paths, and on Windows UNC/device paths and alternate data streams. Names
  must be one clean segment (no separators, no leading/trailing spaces, Windows
  reserved names refused).
* **Hidden** (not listed, not downloadable, not changeable): the service data
  directory (database and keys) and the runtime and stream log directories.
* **Locked** (readable, never changed): operating-system trees (`/usr`, `/etc`, `/var`,
  `/System`, `/Library`, `C:\Windows`, `C:\Program Files`, …) and the service
  executable. Temporary directories (`/tmp`, `/var/tmp`, `/var/folders`) are
  exceptions.
* **Fixed anchors** (cannot be renamed or deleted themselves, children are fine):
  filesystem and drive roots, `/home`, `/Users`, `/Volumes`, `/mnt`, `/media`, `/opt`,
  `/srv`, `/data`, each user's home folder and the direct children of home and mount
  directories. Every **parent** of a hidden or locked path is also fixed, so removing a
  parent can never take protected content with it.
* **Deletion** is permanent. Links are removed, never followed. A recursive delete
  re-checks the guard for each directory, never follows links and refuses to cross a
  file system boundary (bind mounts, other volumes). Non-empty folders need an explicit
  `recursive=true`, and the UI asks for the exact name to be typed.
* **Rename** stays inside the same folder and never overwrites. Moving is not offered.

Refusals answer `403` with `error.params.reason` of `protected_path` or
`os_permission_denied`; conflicts answer `409` with `exists`, `not_empty`, `wrong_kind`,
`read_only` or `unsafe_tree`.

## Operating-system access

The service only sees what its own account can see.

* **Docker**: mount the folders you want to manage into the container and make the
  owner match the container user (for example `PUID`/`PGID`). Unmounted host paths do
  not exist inside the container.
* **macOS**: grant the service (or the terminal that starts it) Full Disk Access to
  browse protected user folders such as Desktop, Documents and external volumes.
* **Windows**: run the service under an account that has rights to the target drives;
  drives that are not present or not readable are simply not listed.

An OS refusal is shown with this guidance rather than a generic failure.

## Limits

Listings show at most 10,000 entries per folder and say when they were truncated.
At most four file operations run at the same time. The check-then-act window between
validation and the file-system call is small but not zero; the protected set is
re-evaluated on the resolved real path of every call.
