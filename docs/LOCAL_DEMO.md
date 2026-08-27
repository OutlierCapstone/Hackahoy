# Hackahoy local demo

The always-on desktop demo is the default operating mode after the public beta.
AWS compute was decommissioned; one archived EBS snapshot remains as a disaster
recovery copy and is not required for normal demos.

## Safety boundary

The challenge services are intentionally vulnerable. Local mode binds the main
gateway and ports 5001-5007 to `127.0.0.1`. Team-share mode binds them only to
the host's Tailscale IPv4 address, not every LAN interface. Use restricted
device sharing/ACLs and do not forward these ports on a router.

Production data is not used. PostgreSQL is seeded with local flags, social
login is disabled, and email is disabled. AI hints and challenge chat for
problems 1 and 3 use the repository's `GEMINI_API_KEY` secret and therefore can
incur Gemini usage; the key is never committed to the repository.

## Start locally

```powershell
$env:GEMINI_API_KEY = '<your development key for this process>'
.\scripts\demo.ps1 Start
```

Open `http://localhost:8080`. The demo PostgreSQL volume survives `Stop`.

## Share with the team

Install and sign in to Tailscale, share this device only with the intended team,
then run:

```powershell
.\scripts\demo.ps1 Start -ShareTeam
```

The script prints private tailnet HTTP URLs for the main gateway and all seven
challenge ports. Traffic between devices is still encrypted by Tailscale. The
host PC, Docker Desktop, and Tailscale must remain running.

### Always-on desktop host

On the desktop host, use the deploy wrapper from the logged-in desktop account.
It uses an anonymous Docker Hub config for public image pulls, starts the
complete stack, and waits for the main health endpoint:

```powershell
.\scripts\desktop-deploy.ps1
```

The GitHub deploy workflow targets a repository self-hosted runner labeled
`hackahoy-demo`. Pull-request CI remains on GitHub-hosted runners; only pushes
to `main` or a manual workflow dispatch can deploy the desktop demo.

The desktop runner is installed at `D:\Services\Hackahoy-actions-runner` and
the `HackahoyGitHubRunner` scheduled task starts it after sign-in. Runner setup
uses `scripts/install-github-runner.ps1` with a short-lived registration token
from the repository's Actions runner settings; the token must never be committed.

The deploy workflow passes the existing `GEMINI_API_KEY` repository secret to
the desktop wrapper. The wrapper keeps only a Windows DPAPI-encrypted copy under
the signed-in account's LocalAppData so automatic restarts can restore it. Do
not add a plaintext key to either checkout or to Compose files.

Docker Desktop, Tailscale, and the signed-in Windows account must be running.
The `HackahoyDemo` scheduled task starts the stack after sign-in. Compose uses
`restart: unless-stopped` so services recover after Docker restarts.

Register or refresh the sign-in task from the desktop checkout with:

```powershell
.\scripts\install-desktop-autostart.ps1
```

## Stop or inspect

```powershell
.\scripts\demo.ps1 Status
.\scripts\demo.ps1 Stop
```

`Stop` does not remove the database volume and does not change Tailscale
configuration.

## Known limitation

Problem 7's frontend is recorded in the parent repository as a gitlink, but the
repository has no `.gitmodules` mapping or submodule object. The local demo uses
a safe placeholder for problem 7. Problems 1-6 and the main platform are built
from tracked sources.

## AWS archive recovery

The EC2 instance, 100 GiB EBS volume, and Elastic IP were removed after the
desktop deployment was verified. The old public IP and DuckDNS route are not
preserved. Snapshot `snap-0f1f25ee509333d6c` remains in the `us-east-1` archive
tier as the recovery source. The helper refuses to inspect a different account:

```powershell
.\scripts\aws-fallback.ps1 Status
.\scripts\aws-fallback.ps1 RestoreInfo
```

Run `aws login` first if the AWS session has expired. An archive restore first
moves the snapshot back to the standard tier, then uses the printed metadata to
create a bootable volume/AMI and a replacement instance. Restoration is manual,
takes hours, creates normal AWS charges, and receives a new public address.
