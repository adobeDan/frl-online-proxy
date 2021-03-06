#!/usr/bin/env node
/*
 * Copyright 2020 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */

import pkg from 'shelljs';
const { rm, mkdir, cp, cd } = pkg;
import archiver from 'archiver';
import tar from 'tar';
import { join } from 'path';
import fs from 'fs';

const version = process.env.npm_package_version;
const packageFile = 'frl-proxy-'+platform()+'-'+version+(platform() == 'win' ? '.zip' : '.tar.gz');
const binary = releasePath();
const externalDir = join('external', platform());
const releaseDir = 'dist';
const packageDir = 'frl-proxy'; 

const archive = (platform() == 'win' ? makeZip : makeTar);

// prepare the release directory
rm('-rf', releaseDir);
mkdir(releaseDir);

cd(releaseDir);

mkdir(packageDir);

// copy external files to package dir
cp('-r', join('..', externalDir, '*'), packageDir);

// copy the release binary to package dir
cp(join('..', binary), packageDir);

makeRelease();

async function makeRelease() {
  await archive(packageDir, packageFile, packageDir);
  console.log(packageFile+' created successfully');
}

function platform() {
    const platform = process.platform;
    if (platform == 'win32') {
        return 'win';
    }
    if (platform == 'darwin') {
        return 'macos';
    }
    return platform;
}

function releasePath() {
    if (platform() == 'linux') {
        return join('target', 'x86_64-unknown-linux-musl', 'release', 'frl-proxy');
    }
    return join('target', 'release', (platform() == 'win' ? 'frl-proxy.exe' : 'frl-proxy'));
}

function makeZip(source, out, innerDir) {
    const archive = archiver('zip', { zlib: { level: 9 }});
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, innerDir)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

async function makeTar(source, out, _) {
    await tar.c(
        {gzip: true, file: out},
        [source]
    );
}
