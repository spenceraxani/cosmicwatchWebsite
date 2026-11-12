import faqs from '@data/faqs.json';
import features from '@data/features.json';

// Every user-facing string on the marketing pages. Edit text here, not in components.
export const en = {
  site: {
    description:
      'CosmicWatch is a University of Delaware outreach program built around a pocket-sized cosmic-ray muon detector that costs about $100 in parts and that students can build themselves.',
    descriptionShort:
      'A pocket-sized cosmic-ray muon detector that students build themselves.',
    ogTitle: 'CosmicWatch: The Desktop Muon Detector',
    ogDescription:
      'Build a cosmic-ray muon detector from about $100 in parts. Open-source hardware, firmware and software from the University of Delaware.',
  },

  layout: {
    skipToContent: 'Skip to content',
    changeLanguage: 'Change language',
    toggleNavigation: 'Toggle navigation',
    darkTheme: 'Dark theme',
    lightTheme: 'Light theme',
    toggleTheme: 'Toggle theme',
  },
  share: {
    share: 'Share',
    shareOn: (platform: string) => `Share on ${platform}`,
    copied: 'Copied',
    copyLink: 'Copy link',
  },

  nav: {
    labels: {
      detector: 'Detector',
      docs: 'Guides',
      measure: 'Measure',
      downloads: 'Downloads',
      contact: 'Contact',
    },
    buy: 'Shop',
    footer: {
      sectionTitles: {
        program: 'Program',
        detector: 'Detector',
        get: 'Get started',
      },
      links: {
        about: 'About CosmicWatch',
        people: 'People',
        contact: 'Contact & FAQ',
        detector: 'The v3X detector',
        build: 'Build guide',
        measurements: 'Measurements',
        troubleshooting: 'Troubleshooting',
        measure: 'Measure in your browser',
        downloads: 'Software & firmware',
        purchase: 'Shop',
        github: 'GitHub repository',
        papers: 'Papers',
      },
      blurb:
        'An education and outreach program in particle, nuclear and astroparticle physics, led by the University of Delaware.',
      department:
        'Department of Physics and Astronomy, University of Delaware, Newark, DE',
      license:
        'Detector designs and documentation are licensed CC BY-NC 4.0.',
      email: 'Email',
      github: 'GitHub',
    },
  },

  notFound: {
    title: 'Page not found',
    subTitle: 'Nothing was detected here.',
    content:
      'The page you were looking for has moved or never existed. Try the home page or the build guide.',
    goHome: 'Go to the home page',
    goBuild: 'Open the build guide',
    goBack: 'Go back',
  },

  home: {
    hero: {
      title:
        'The CosmicWatch v3X:<br />A Desktop Particle Detector',
      subTitle:
        'CosmicWatch is a pocket-sized cosmic-ray muon detector that can be built from about $100 in parts, developed and run by the Department of Physics and Astronomy at the University of Delaware.',
      primaryBtn: 'Build a Detector',
      secondaryBtn: 'Buy a Detector',
      imageAlt:
        'Three CosmicWatch v3X detectors in blue, yellow and silver aluminum cases, with the OLED screen, LEDs, USB, microSD and coincidence ports labeled',
      imageCaption:
        'Three v3X detectors. Each one counts muons on its own or links to a second detector for coincidence measurements.',
      specs: [
        { value: '~$100', label: 'in parts' },
        { value: '700 Hz', label: 'max event rate' },
        { value: '0.5 W', label: 'from any USB port' },
        { value: '110 g', label: 'in its case' },
      ],
      heroImageAlt:
        'Two v3X detectors stacked, the top one in a yellow case and the bottom one in blue, both screens showing the CosmicWatch logo',
      heroImageCaption: 'Two v3X detectors stacked for a coincidence run.',
    },
    featuresGeneral: {
      title: 'What is inside',
      subTitle:
        'Our detector is a self-contained apparatus that employs a 5 × 5 × 1 cm slab of plastic scintillator as a detection medium and a silicon photomultiplier (SiPM) for light collection. Custom-designed electronics shape the signal, and a Raspberry Pi Pico records every event.',
      imageAlt:
        'Exploded view of the CosmicWatch v3X: scintillator, SiPM board, main board, aluminum case and faceplates',
    },
    featuresNavs: {
      title:
        'Three ways to take data',
      tabs: {
        sd: {
          heading: 'Standalone on a microSD card',
          content:
            'If a microSD card is inserted, the detector creates a new file each time it is powered on or reset. Plug it into a USB power bank and walk away: a 4 GB card holds several months of continuous data at sea level.',
          alt: 'Top view of the CosmicWatch v3X main circuit board',
        },
        gui: {
          heading: 'Live on your computer',
          content:
            'Plug the detector into a computer and the CosmicWatch GUI plots coincident and non-coincident rates, SiPM pulse-height spectra, pressure, temperature and motion in real time. It also reopens saved files, so you can make publication-ready figures later.',
          alt: 'Screenshot of the CosmicWatch GUI plotting count rates',
        },
        coincidence: {
          heading: 'Two detectors in coincidence',
          content:
            'Connect two detectors with a standard CAT5 or CAT6 cable and reboot them. Events that hit both within 2.3 µs are flagged as coincident, which rejects the gamma and beta background and leaves a clean sample of cosmic-ray muons.',
          alt: 'Two CosmicWatch detectors stacked and connected in coincidence mode',
        },
      },
    },
    stats: {
      title: 'What the v3X can do',
      subTitle:
        'The v3X keeps the size and price of earlier versions and improves almost everything else.',
      mainStatTitle: '~$100',
      mainStatSubTitle: 'in parts for one complete detector',
      stats: [
        { stat: '700 Hz', description: 'maximum event rate, up from 15 Hz on v2' },
        { stat: '0.5 W', description: 'runs off a phone charger or power bank' },
        { stat: '31 km', description: 'highest balloon flight so far' },
      ],
    },
    realRun: {
      title: 'Muon rate and air pressure from a real run',
      body: 'This is 62 hours from one detector pair in the Axani lab at UD. Higher air pressure means more atmosphere overhead to stop muons, so the rate should dip when the pressure rises. The effect is small, about one percent across this run, so it hides in the hour-to-hour scatter. A straight-line fit pulls it out.',
      pressureLabel: 'Air pressure (hPa)',
      rateLabel: 'Coincidence rate (muons per minute)',
      timeLabel: 'Pressure is hourly. The rate shows hourly values (thin) and a 5-hour running average (thick).',
      source: 'From AxLab_C_001.txt in the v3X GitHub repository.',
      finding: '−0.14 ± 0.09% per hPa',
      findingNote: 'The fitted change in muon rate for each hectopascal of pressure, from the 62 hourly points. The error bar is still large; a longer run, or one through a big weather change, shrinks it.',
      cta: 'Analyze this run yourself',
    },
    pipeline: {
      title: 'From a muon to a line in your data file',
      subTitle:
        'Every count on the screen is a particle that passed through the plastic. This is what happens in the few microseconds after it does.',
      steps: [
        {
          title: 'A muon passes through',
          body: 'Cosmic rays, mostly protons, collide with the atmosphere and produce showers of particles that decay to muons. Time dilation lets the muons survive the trip down: about one per square centimeter per minute reaches sea level.',
        },
        {
          title: 'The scintillator flashes',
          body: 'When a charged particle passes through the scintillating material, part of its energy is absorbed and re-emitted as photons, about 10,000 for every MeV deposited.',
        },
        {
          title: 'The SiPM catches the light',
          body: 'A 6 × 6 mm silicon photomultiplier (SiPM) coupled to the scintillator observes these photons and converts them into an electrical pulse whose height is proportional to the light.',
        },
        {
          title: 'The electronics measure it',
          body: 'The pulse is amplified 13.5 times. A comparator triggers the event and timestamps it, while a peak detector holds the pulse height for the Pico’s 12-bit ADC.',
        },
        {
          title: 'The event is logged',
          body: 'Event number, time, pulse height, dead time, temperature, pressure and motion go to the microSD card and out over USB, with a flag if a second detector saw it too.',
        },
      ],
      waysTitle: 'Three ways to take data',
      ways: [
        {
          title: 'Standalone on a microSD card',
          body: 'Plug into a USB power bank and walk away. Each run writes a new plain-text file to the card.',
          url: '/docs/guides/instruction-manual/the-cosmicwatch-desktop-muon-detector-v3x/#recording-data-options',
        },
        {
          title: 'Live on your computer',
          body: 'Plug into USB and the Measure page plots rate, pulse height, temperature and pressure as events arrive. No install needed.',
          url: '/measure',
        },
        {
          title: 'Two detectors in coincidence',
          body: 'Link two detectors with a CAT5 or CAT6 cable. Events seen by both within 2.3 µs are flagged as coincident muons.',
          url: '/docs/guides/instruction-manual/the-cosmicwatch-desktop-muon-detector-v3x/#setting-detectors-in-coincidence-mode',
        },
      ],
    },
    measurements: {
      title: 'What you can measure',
      subTitle:
        'Below are a few of the measurements made with our CosmicWatch detectors, from a single detector on a desk to balloon flights and mines. Each one has a full write-up in the guides. Check them out!',
      all: 'See all 20 measurements',
    },
    closing: {
      title: 'Build one this semester',
      body: 'You want to build your own CosmicWatch detector? It’s easy and inexpensive. The parts cost about $100, the circuit boards and firmware are free, and a first-time builder needs about four hours.',
      primary: 'Read the build guide',
      secondary: 'See the parts list',
      github: 'Everything is on GitHub',
      imageAlt: 'Plastic scintillator slabs glowing blue under ultraviolet light',
    },
    heroAlt: {
      title: 'Everything is open source',
      subTitle:
        'All material for the v3X can be found in the GitHub repository: circuit boards, firmware, the GUI, enclosure drawings and the instruction manual. If you change the design or measure something new, let us know.',
      btn: 'Open the GitHub repo',
    },
  },

  contact: {
    title: 'Contact',
    metaDescription:
      'Questions about building, buying or using a CosmicWatch detector? Get in touch with the CosmicWatch team at the University of Delaware.',
    ogTitle: 'Contact | CosmicWatch',
    heading: 'Contact us',
    subTitle:
      'Questions about building, buying or using a detector? Send a message, or check the FAQ below.',
    formTitle: 'Send a message',
    formSubTitle: 'Your message goes straight to Prof. Axani. We usually reply within a few days.',
    firstName: 'First name',
    lastName: 'Last name',
    details: 'Your message',
    send: 'Send message',
    sending: 'Sending…',
    missing: 'Please fill in your email address and a message.',
    notLive: 'Sending from this page isn’t switched on yet. Please',
    thanksTitle: 'Message sent',
    thanksBody: 'Thanks for getting in touch. Prof. Axani will reply to the email address you gave, usually within a few days.',
    thanksBack: 'Back to the home page',
    thanksGuides: 'Browse the guides',
    notLiveLink: 'email your message to saxani@udel.edu',
    leadHeading: 'Prof. Spencer Axani',
    leadContent: 'Program lead, Department of Physics and Astronomy, University of Delaware',
    docsHeading: 'Guides',
    docsContent: 'The build manual, example measurements, physics and troubleshooting.',
    docsLink: 'Open the guides',
    troubleshootHeading: 'Something not working?',
    troubleshootContent:
      'Most problems are a solder joint or a light leak. The troubleshooting guide walks through the checks.',
    troubleshootLink: 'Troubleshooting',
    officeHeading: 'Where we are',
    officeContent: 'CosmicWatch, Department of Physics and Astronomy',
    officeAddress: 'Sharp Lab, University of Delaware, Newark, DE 19716',
    faqTitle: 'Questions people ask first',
  },

  about: {
    title: 'About CosmicWatch',
    body:
      'CosmicWatch is an education and outreach program aimed at introducing people to particle, nuclear and astro-particle physics. It provides educational materials and support allowing to build or buy particle detectors and make physics measurements. The original program was initiated at the Massachusetts Institute of Technology (MIT) and Polish National Center for Nuclear Research (NCBJ) in 2017. Currently it is lead by University of Delaware and has substantially grown and changed, resulting in new detector versions and novel uses like calibration instruments for neutrino detectors, spacecraft instrumentation, education and outreach.',
    peopleCta: 'Who to contact',
    papersTitle: 'Papers',
    papersSubTitle:
      'Cite the paper for the version you used. Every paper links to its free arXiv copy.',
  },

  detector: {
    title: 'The v3X detector',
    metaDescription:
      'Specifications, parts and photos of the CosmicWatch Desktop Muon Detector v3X: plastic scintillator, SiPM, Raspberry Pi Pico, OLED, microSD and coincidence mode.',
    ogTitle: 'The v3X Detector | CosmicWatch',
    heading: 'The Desktop Muon Detector, v3X',
    subTitle:
      'A compact, low-cost and portable device for detecting ionizing radiation, including cosmic-ray muons. The scintillator, SiPM, custom electronics, OLED display, environmental sensors and microSD storage fit in a case the size of a deck of cards, powered from any USB port.',
    intro:
      'You want to build your own CosmicWatch detector? It’s easy and inexpensive. The Instruction Manual takes you from ordering parts to your first measurement, and every design file is on GitHub.',
    buildBtn: 'Build guide',
    buyBtn: 'Buy one',
    insideTitle: 'What is on the board',
    galleryTitle: 'Renders and photos',
    licenseNote:
      'Designs are CC BY-NC 4.0. You can build and modify detectors for personal and educational use; commercial sale needs written permission.',
  },


  people: {
    heading: 'People',
    subTitle: 'The team working on CosmicWatch now, in the Axani lab at the University of Delaware.',
  },

  shop: {
    title: 'Shop',
    metaDescription:
      'Assembled CosmicWatch v3X detectors, coincidence pairs, build-it-yourself kits, circuit boards and spare parts.',
    ogTitle: 'Shop | CosmicWatch',
    heading: 'Shop',
    subTitle:
      'Assembled detectors, kits for classes that want to solder, and spare parts. Everything here can also be built from the free designs on GitHub.',
    priceOnRequest: 'Price on request',
    policyTitle: 'Purchases happen outside this site',
    policyBody: (store: string) =>
      `The University of Delaware does not take payments on its websites, so this page only shows what is available. Buying is handled by ${store}, a separate service; this site never asks for payment or shipping details.`,
    bulkNote: 'Ordering for a whole class, or have a question first? Email',
    buy: 'Buy',
    opensStore: (store: string) => `(opens ${store} in a new tab)`,
    soon: 'Available soon',
    quarknetTitle: 'Teachers: borrow before you buy',
    quarknetBody:
      'QuarkNet, the teacher network for particle physics, lends CosmicWatch detectors to classrooms and runs workshops on building them.',
  },

  github: {
    title: 'Downloads',
    metaDescription:
      'Download the CosmicWatch GUI, firmware and data scripts. Everything comes straight from the CosmicWatch v3X GitHub repository.',
    ogTitle: 'Downloads | CosmicWatch',
    heading: 'Downloads',
    subTitle:
      'All supplementary materials, including the firmware, the GUI and the Python script that records data to your computer, can be found in the GitHub repository. The links below point straight at it, so they are always up to date.',
  },

  data: { faqs, features },
};
