# Bitburner Scripts

This is a collection of scripts I've written and/or compiled for the game Bitburner. Any script not written by me should have a reference to the author/page it was taken from. The infrastructure for this repo is taken from here: https://github.com/bitburner-official/typescript-template

## Installation

Follow the instructions from the original repository linked above. Everything from installation to building scripts is the same.

## About

All the game's scripts live in the `src` folder. From there, I use the following structure:
```
src/
├── dev/
│   └── anything considered "in progress" or "in testing" lives here
└── fs/
    ├── all scripts are added to this folder eventually. stands for "file system".
    ├── the reason: by default this repo will overwrite any in-game scripts with the same name.
    ├── with the "fs/" prefix, this prevents any unwanted overwriting.
    ├── ---------------------------------------------------------------------------------------
    ├── bin/
    │   ├── any and all "binaries" live here.
    │   ├── if it gets copied to and run by a worker server, it lives here.
    │   ├── typically absent of logic, just "do X"
    │   └── (hack.ts, weaken.ts, etc.)
    ├── ---------------------------------------------------------------------------------------
    ├── lib/
    │   ├── any libraries that can/should be used everywhere live here.
    │   ├── --------------------
    │   ├── types/
    │   │   └── any Typescript types used in multiple places should live here.
    │   └── util/
    │       ├── any utilities that can/should be used everywhere live here.
    │       ├── typically includes functions with 0 additional RAM cost.
    │       └── (print.ts, time.ts, colors.ts, etc.)
    ├── ---------------------------------------------------------------------------------------
    ├── sbin/
    │   ├── any and all "system binaries" live here.
    │   ├── typically includes maintenance/setup processes for organization and operations.
    │   ├── (lock.ts, set-config.ts, etc.)
    │   ├── --------------------
    │   └── lib/
    │       ├── libraries specifically for sbin live here.
    │       ├── should not be accessed outside of sbin.
    │       └── (functions/settings for lock files, file locations, etc.)
    ├── ---------------------------------------------------------------------------------------
    ├── tmp/
    │   ├── any and all temporary files live here.
    │   └── is cleared regularly.
    ├── ---------------------------------------------------------------------------------------
    └── usr/
        ├── bin/
        │   ├── anything I would manually run from the CLI lives here.
        │   └── (find.ts, purchase.ts, deploy.ts, etc)
        ├── lib/
        │   ├── any libraries used by usr/bin or usr/sbin live here.
        │   ├── typically includes the logic behind everything.
        │   └── (servers.ts, targets.ts, threads.ts, etc.)
        └── sbin/
            ├── like usr/bin, but focused on system operations
            └── (init.ts, etc.)
```
(awesome filetree generated using https://tree.nathanfriend.io/)