---
title: 'Firmware 1.1.52: no more OLED burn-in'
description: 'The screen readout now shifts slightly every minute, so detectors that run for months keep a clean display.'
author: 'CosmicWatch team'
authorImage: '../../../images/icon.png'
authorImageAlt: 'CosmicWatch logo'
pubDate: 2026-07-20
cardImage: '../../../images/cw/render-yellow-front.png'
cardImageAlt: 'Front of a v3X detector in a yellow case, showing the OLED screen and LEDs'
readTime: 1
tags: ['firmware']
---

OLED screens burn in when the same pixels stay lit for weeks, and many detectors run that long. Firmware 1.1.52 moves the readout by a few pixels every minute so no pixel stays on all the time.

To update, hold BOOTSEL on the Pico, plug it in, and drag the new `.uf2` file onto the drive that appears. Get it from the [Firmware folder](https://github.com/spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X/tree/main/Firmware) or the [Software page](/software/).
