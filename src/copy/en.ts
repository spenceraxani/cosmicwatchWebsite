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
      about: 'About',
      detector: 'Detector',
      docs: 'Guides',
      measure: 'Measure',
      software: 'Software',
      news: 'News',
      people: 'People',
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
        news: 'News',
        contact: 'Contact & FAQ',
        detector: 'The v3X detector',
        build: 'Build guide',
        measurements: 'Measurements',
        troubleshooting: 'Troubleshooting',
        measure: 'Measure in your browser',
        software: 'Software & firmware',
        purchase: 'Shop',
        github: 'GitHub activity',
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

  blog: {
    readMore: 'Read more',
    minRead: (minutes: number) => `${minutes} min read`,
    relatedArticles: 'More news',
    wasHelpful: 'Was this post useful?',
    yes: 'Yes',
    no: 'No',
    ogSection: 'News',
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
    banner: 'New: the v3X spaceflight paper is on arXiv',
    hero: {
      title:
        'A particle detector you can build yourself',
      subTitle:
        'CosmicWatch is a pocket-sized cosmic-ray muon detector built from about $100 in parts. Students can solder one in an afternoon and take real data the same day.',
      primaryBtn: 'Build one',
      secondaryBtn: 'Buy a detector',
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
    clients: {
      title: 'Built and used at',
      subTitle:
        'Universities and labs that build CosmicWatch detectors or use them in courses and experiments.',
    },
    featuresGeneral: {
      title: 'What is inside',
      subTitle:
        'A 5 × 5 × 1 cm slab of plastic scintillator flashes when a charged particle passes through it. A silicon photomultiplier catches the light, and custom electronics on a Raspberry Pi Pico turn each flash into a logged event.',
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
            'Plug the detector into any USB power bank and walk away. Every event goes to a text file on the card, with a new file each time it resets. A 4 GB card holds months of data at sea level.',
          alt: 'Top view of the CosmicWatch v3X main circuit board',
        },
        gui: {
          heading: 'Live on your computer',
          content:
            'The CosmicWatch GUI plots count rate, pulse-height spectrum, temperature, pressure and motion in real time over USB, and reopens old files for analysis.',
          alt: 'Screenshot of the CosmicWatch GUI plotting count rates',
        },
        coincidence: {
          heading: 'Two detectors in coincidence',
          content:
            'Link two detectors with a network cable and they flag events that hit both at once. That rejects almost all radioactive background and leaves a clean sample of cosmic-ray muons.',
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
        'Every count on the screen is a particle that went through the plastic. This is what happens in the few microseconds after it does.',
      steps: [
        {
          title: 'A muon passes through',
          body: 'Cosmic rays hit the upper atmosphere and make showers of particles. Muons are the ones that reach the ground, about one per square centimeter per minute.',
        },
        {
          title: 'The scintillator flashes',
          body: 'The 5 × 5 × 1 cm plastic slab gives off a short flash of light where the particle crossed it.',
        },
        {
          title: 'The SiPM catches the light',
          body: 'A 6 × 6 mm silicon photomultiplier on the end of the slab turns the flash into a small electrical pulse.',
        },
        {
          title: 'The electronics measure it',
          body: 'An amplifier and peak detector hold the pulse at its highest point so the Raspberry Pi Pico can read its height with a 12-bit ADC.',
        },
        {
          title: 'The event is logged',
          body: 'Time, pulse height, temperature, pressure and motion go to the microSD card, to your computer over USB, or both.',
        },
      ],
      waysTitle: 'Three ways to take data',
      ways: [
        {
          title: 'Standalone on a microSD card',
          body: 'Plug into a USB power bank and walk away. Each run writes a new text file.',
          url: '/docs/recording-data/',
        },
        {
          title: 'Live on your computer',
          body: 'Plug into USB and the Measure page plots rate, pulse height, temperature and pressure as events arrive. No install needed.',
          url: '/measure',
        },
        {
          title: 'Two detectors in coincidence',
          body: 'Link two detectors with a network cable to keep only particles that hit both. That removes almost all background.',
          url: '/docs/coincidence-mode/',
        },
      ],
    },
    measurements: {
      title: 'What you can measure',
      subTitle:
        'Twenty measurements, each with a write-up in the docs. Some need one detector on a desk; others went up on balloons or down into mines.',
      all: 'See all 20 measurements',
    },
    news: {
      title: 'Latest news',
      all: 'All news',
    },
    faqTitle: 'Questions people ask first',
    closing: {
      title: 'Build one this semester',
      body: 'The parts cost about $100, the circuit boards and firmware are free, and the build guide walks through every solder joint. A first build takes about an afternoon.',
      primary: 'Read the build guide',
      secondary: 'See the parts list',
      github: 'Everything is on GitHub',
      imageAlt: 'Plastic scintillator slabs glowing blue under ultraviolet light',
    },
    heroAlt: {
      title: 'Everything is open source',
      subTitle:
        'Circuit boards, firmware, the GUI, enclosure drawings and the manuals are all on GitHub. If you change the design or measure something new, let us know.',
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
      'Questions about building, buying or using a detector? Check the FAQ below first, then send us a note.',
    formTitle: 'Send a message',
    formSubTitle:
      'This opens your email app with the message filled in. We usually reply within a few days.',
    firstName: 'First name',
    lastName: 'Last name',
    details: 'Your message',
    send: 'Open in email',
    demoMessage: 'Opening your email app…',
    docsHeading: 'Build guide and docs',
    docsContent: 'Step-by-step build instructions and all 20 measurements.',
    docsLink: 'Open the docs',
    troubleshootHeading: 'Something not working?',
    troubleshootContent:
      'Most problems are a solder joint or a light leak. The troubleshooting page walks through the checks.',
    troubleshootLink: 'Troubleshooting',
    officeHeading: 'Where we are',
    officeContent: 'CosmicWatch, Department of Physics and Astronomy',
    officeAddress: 'Sharp Lab, University of Delaware, Newark, DE 19716',
    emailHeading: 'Email',
    emailContent: 'Prof. Spencer Axani, program lead:',
    faqTitle: 'Questions people ask first',
  },

  newsIndex: {
    title: 'News',
    metaDescription:
      'Papers, flights, firmware releases and other updates from the CosmicWatch program.',
    ogTitle: 'News | CosmicWatch',
    heading: 'News',
    subTitle: 'Papers, flights, firmware releases and other updates.',
    noPosts: 'No news yet. Check back soon.',
  },

  about: {
    nextLabel: 'Next',
    title: 'About',
    metaDescription:
      'How CosmicWatch started as an MIT student project and became a University of Delaware program used in classrooms, labs and spaceflight.',
    ogTitle: 'About | CosmicWatch',
    intro: {
      title: 'About CosmicWatch',
      subTitle:
        'CosmicWatch is an education and outreach program that introduces people to particle, nuclear and astroparticle physics by having them build a real detector and use it. It began as a student project at MIT in 2016 and is now led by the University of Delaware.',
      cta: 'Meet the people',
    },
    chapters: {
      origin: {
        title: 'It started as a part for a neutrino telescope',
        subTitle:
          "Spencer Axani built the first desktop muon detector as an MIT graduate student, as a prototype sub-detector for an upgrade to the IceCube Neutrino Observatory at the South Pole. With Prof. Janet Conrad at MIT, and later Katarzyna Frankiewicz at Poland's National Centre for Nuclear Research, he turned it into a project students could build in an afternoon. The first version was published in 2017.",
        imageAlts: ['A wrapped plastic scintillator glowing blue under UV light'],
      },
      v2: {
        title: 'Version 2 went everywhere',
        subTitle:
          'The v2 detector, published in 2018, ran on an Arduino Nano. People carried it 1 km underground at Super-Kamiokande, on flights to the South Pole, onto Fermilab beamlines and up on weather balloons. By 2018 more than 50 people had built over 100 of them.',
        imageAlts: ['Measured muon rate on a series of flights to the South Pole'],
      },
      ud: {
        title: 'Now at the University of Delaware',
        subTitle:
          "Axani joined UD's Department of Physics and Astronomy in 2022 and brought CosmicWatch with him. The v3X, built around a Raspberry Pi Pico, came out of his lab in 2025. It is used in MIT's Junior Lab, UD's Advanced Lab and Cornell's intro labs, and for calibration at UD's NuDot and the CCM experiment at Los Alamos.",
        imageAlts: [
          'An array of CosmicWatch v3X detectors in blue and yellow cases',
          'Two v3X detectors stacked in coincidence mode',
        ],
      },
      next: {
        title: 'What comes next',
        subTitle:
          'Thousands of detectors have been built since the first version. The plan now is a worldwide citizen-science network: detectors on WiFi sending their rates to a UD server, so anyone can look for day-night cycles, weather and solar effects across the planet.',
        imageAlts: ['Diagram of a cosmic-ray air shower developing in the atmosphere'],
      },
    },
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
      'A self-contained particle detector the size of a deck of cards. It counts cosmic-ray muons and other ionizing radiation, records every event with environmental data, and runs for days on a power bank.',
    buildBtn: 'Build guide',
    buyBtn: 'Buy one',
    specsTitle: 'v2 compared with v3X',
    specsSubTitle:
      'Numbers from the v3X paper (Table 1). Better values are on the v3X side almost everywhere.',
    specsHead: ['Specification', 'v2', 'v3X'],
    insideTitle: 'What is on the board',
    galleryTitle: 'Renders and photos',
    licenseNote:
      'Designs are CC BY-NC 4.0. You can build and modify detectors for personal and educational use; commercial sale needs written permission.',
  },

  software: {
    title: 'Software',
    metaDescription:
      'Download the CosmicWatch GUI, firmware and data scripts, or read a detector straight from your browser.',
    ogTitle: 'Software & Firmware | CosmicWatch',
    heading: 'Software and firmware',
    subTitle:
      'The desktop GUI, the detector firmware and the Python scripts the lab uses. To read a detector without installing anything, use the Measure page.',
  },

  people: {
    title: 'People',
    metaDescription:
      'The people who design, build and support CosmicWatch at the University of Delaware and its partner institutions.',
    ogTitle: 'People | CosmicWatch',
    heading: 'People',
    subTitle:
      'CosmicWatch is run out of the Axani lab at the University of Delaware, with long-running partners at MIT and in Poland.',
    teamTitle: 'Current team',
    foundersTitle: 'Founders and collaborators',
    sponsorsTitle: 'Support',
    sponsorsSubTitle:
      'CosmicWatch began with support from the grants below.',
  },

  shop: {
    title: 'Shop',
    metaDescription:
      'Order an assembled CosmicWatch v3X detector, a coincidence pair, a build-it-yourself kit, circuit boards or spare parts.',
    ogTitle: 'Shop | CosmicWatch',
    heading: 'Shop',
    subTitle:
      'Assembled detectors, kits for classes that want to solder, and spare parts. Add what you need and send the order to the lab; it replies with a quote and an invoice.',
    priceOnRequest: 'Price on request',
    qty: 'Quantity',
    add: 'Add to order',
    cartTitle: 'Your order',
    cartEmpty: 'Nothing added yet. Pick a detector or kit on the left.',
    name: 'Your name',
    email: 'Email',
    org: 'School or organization (optional)',
    ship: 'Shipping address',
    send: 'Send order request',
    copyOrder: 'Copy order',
    payNote:
      'Paying online with PayPal or a card will be added here once the University of Delaware approves it. Until then the lab invoices each order.',
    quarknetTitle: 'Teachers: borrow before you buy',
    quarknetBody:
      'QuarkNet, the teacher network for particle physics, lends CosmicWatch detectors to classrooms and runs workshops on building them.',
  },

  github: {
    title: 'GitHub activity',
    metaDescription:
      'Recent changes to the CosmicWatch v3X GitHub repository: latest commits, firmware version and project files.',
    ogTitle: 'GitHub Activity | CosmicWatch',
    heading: 'CosmicWatch on GitHub',
    subTitle:
      'Every design file, the firmware, the GUI and the manuals live in one public repository. This is what has changed lately.',
  },

  data: { faqs, features },
};
