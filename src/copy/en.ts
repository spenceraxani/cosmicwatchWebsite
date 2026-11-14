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
    tagline: 'Desktop Muon Detector',
    footer: {
      sectionTitles: {
        program: 'Program',
        detector: 'Detector',
        get: 'Get Started',
      },
      links: {
        about: 'About CosmicWatch',
        people: 'Project Members',
        contact: 'Contact & FAQ',
        detector: 'The v3X Detector',
        build: 'Build Guide',
        measurements: 'Measurements',
        troubleshooting: 'Troubleshooting',
        measure: 'Measure in Your Browser',
        downloads: 'Software & Firmware',
        purchase: 'Shop',
        github: 'GitHub Repository',
        papers: 'Papers',
      },
      blurb:
        'A University of Delaware-led outreach program aimed at introducing students to particle, nuclear, and astro-particle physics.',
      department:
        'Department of Physics & Astronomy, University of Delaware, Newark, DE',
      license: 'Detector designs and documentation are licensed CC BY-NC 4.0.',
      email: 'Email',
      github: 'GitHub',
    },
  },

  notFound: {
    title: 'Page Not Found',
    subTitle: 'Nothing was detected here.',
    content:
      'The page you were looking for has moved or never existed. Try the home page or the build guide.',
    goHome: 'Go to the home page',
    goBuild: 'Open the build guide',
    goBack: 'Go back',
  },

  home: {
    hero: {
      eyebrow: '',
      title: 'CosmicWatch: The Desktop Muon Detector',
      subTitle:
        'CosmicWatch is a pocket-sized cosmic-ray muon detector that can be built from about $100 in parts, developed and run by the Department of Physics & Astronomy at the University of Delaware.',
      primaryBtn: 'Build a Detector',
      secondaryBtn: 'Buy a Detector',
      imageAlt:
        'Three CosmicWatch v3X detectors in blue, yellow and silver aluminum cases, with the OLED screen, LEDs, USB, microSD and coincidence ports labeled',
    },
    featuresGeneral: {
      title: 'Look Inside the Detector',
      subTitle:
        'The latest version, the CosmicWatch v3X, is a self-contained apparatus that uses a plastic scintillator to turn each passing particle into a flash of light, which a silicon photomultiplier (SiPM) collects. The custom printed circuit board is designed to process the signal and record the event, with onboard data storage, an OLED display, environmental sensors, and USB connectivity.',
      imageAlt:
        'Exploded view of the CosmicWatch v3X: scintillator, SiPM board, main board, aluminum case and faceplates',
    },
    featuresNavs: {
      title: 'Three Methods to Take Data',
      tabs: {
        sd: {
          heading: 'Standalone on a microSD Card',
          content:
            'If a microSD card is inserted, the detector creates a new file each time it is powered on or reset. A relatively small microSD card (≥4 GB) holds several months of continuous data at sea level.',
          alt: 'Bottom of the CosmicWatch v3X circuit board with a microSD card inserted in its slot',
        },
        gui: {
          heading: 'Live on Your Computer',
          content:
            'The CosmicWatch graphical user interface (GUI) visualizes data in real time through a serial port connection, or from saved .txt files. Users can explore coincident and non-coincident event rates, SiPM pulse-height spectra, pressure, temperature, and motion.',
          alt: 'Screenshot of the CosmicWatch GUI plotting count rates',
          link: 'Download the GUI',
          linkNote: 'From GitHub',
          install: 'How to install',
        },
        web: {
          heading: 'Live on This Website',
          content:
            'Plug the detector into a USB port and open the Measure page in Chrome or Edge. The page reads the detector directly, plots the count rate and pulse heights as events arrive, and saves the run as a .txt file and a PDF report. Nothing to install.',
          alt: 'The Measure page on this website plotting a CosmicWatch run',
          link: 'Open the Measure Page',
        },
      },
    },
    pipeline: {
      title: 'How CosmicWatch Detects and Registers a Muon',
      steps: [
        {
          title: 'A Particle Passes Through the Scintillator',
          body: 'When a charged particle (e.g., an electron, proton, or muon) passes through the 5 × 5 × 1 cm³ plastic scintillator slab, it excites the scintillant molecules, which then de-excite by emitting photons isotropically along the particle’s track. The scintillator converts the deposited energy into light.',
        },
        {
          title: 'The SiPM Converts Light to an Electric Pulse',
          body: 'A portion of this light is collected by a 6 × 6 mm² silicon photomultiplier (SiPM), optically coupled to the scintillator with optical gel and/or a silicone pad. The SiPM converts each detected photon into an electrical pulse, the amplitude (or pulse height) of which is proportional to the light intensity.',
        },
        {
          title: 'The Pulse Is Amplified and Measured',
          body: 'The SiPM signal is amplified and sent to a comparator and a peak detector circuit. The comparator triggers data acquisition by providing a timestamp, while the peak detector holds a constant fraction of the pulse peak for accurate amplitude measurement by the Raspberry Pi Pico (RPi) MCU.',
        },
        {
          title: 'Coincident Events Are Flagged',
          body: 'In a two-detector configuration, a coincidence event, defined as a trigger in both detectors within a predefined time window, is flagged when both comparators fire nearly simultaneously. This temporal correlation effectively rejects uncorrelated background events, such as environmental gamma and beta radiation.',
        },
        {
          title: 'The Event Is Recorded',
          body: 'Once triggered, the RPi records the event count, timestamp, 12-bit pulse amplitude, SiPM pulse height, temperature, barometric pressure, linear acceleration, angular velocity, cumulative dead time, and whether or not the event was seen by a coincident detector.',
        },
      ],
    },
    measurements: {
      title: 'What You Can Measure',
      subTitle:
        'Below, you can find a few example measurements made with our CosmicWatch detectors. Many more examples and detailed explanations can be found in the guides. Check it out!',
      all: 'See all 20 measurements',
    },
    heroAlt: {
      title:
        '<span class="block">Visit the CosmicWatch v3X</span><span class="block">on <span class="text-orange-400 dark:text-orange-300">GitHub</span></span>',
      subTitle:
        'All material pertaining to the v3X detector can be found in the GitHub repository. A full instruction manual is available on the GitHub repository, which contains the information needed to purchase the components and build a complete detector.',
      btn: 'Open the GitHub repo',
    },
  },

  contact: {
    title: 'Contact',
    metaDescription:
      'Questions about building, buying or using a CosmicWatch detector? Get in touch with the CosmicWatch team at the University of Delaware.',
    ogTitle: 'Contact | CosmicWatch',
    heading: 'Contact Us',
    subTitle:
      'Questions about building, buying or using a detector? Send a message, or check the FAQ below.',
    formTitle: 'Send a Message',
    firstName: 'First name',
    lastName: 'Last name',
    details: 'Your message',
    send: 'Send message',
    sending: 'Sending…',
    missing: 'Please fill in your email address and a message.',
    captcha: 'Please complete the check above the Send button.',
    notLive: 'If your email app didn’t open or the message didn’t send, please',
    thanksTitle: 'Message Sent',
    thanksBody:
      'Thanks for getting in touch. Prof. Axani will reply to the email address you gave, usually within a few days.',
    thanksBack: 'Back to the home page',
    thanksGuides: 'Browse the guides',
    notLiveLink: 'email it to saxani@udel.edu',
    leadHeading: 'Dr. Spencer Axani',
    leadContent:
      'Program lead, Department of Physics & Astronomy, University of Delaware',
    docsHeading: 'Guides',
    docsContent:
      'The build manual, example measurements, physics and troubleshooting.',
    docsLink: 'Open the guides',
    troubleshootHeading: 'Something Not Working?',
    troubleshootContent:
      'Most problems are a solder joint or a light leak. The troubleshooting guide walks through the checks.',
    troubleshootLink: 'Troubleshooting',
    officeHeading: 'Where We Are',
    officeContent: 'CosmicWatch, Department of Physics & Astronomy',
    officeAddress: 'Sharp Lab, University of Delaware, Newark, DE 19716',
    faqTitle: 'Frequently Asked Questions',
  },

  about: {
    title: 'About CosmicWatch',
    body: 'CosmicWatch is an education and outreach program aimed at introducing people to particle, nuclear and astro-particle physics. It provides educational materials and support allowing to build or buy particle detectors and make physics measurements. The original program was initiated at the Massachusetts Institute of Technology (MIT) and Polish National Center for Nuclear Research (NCBJ) in 2017. Currently it is lead by University of Delaware and has substantially grown and changed, resulting in new detector versions and novel uses like calibration instruments for neutrino detectors, spacecraft instrumentation, education and outreach. The latest version of the detector is the CosmicWatch v3X.',
    peopleCta: 'Who to contact',
    papersTitle: 'Featured Papers Involving the CosmicWatch',
  },

  detector: {
    title: 'The v3X Detector',
    metaDescription:
      'Specifications, parts and photos of the CosmicWatch Desktop Muon Detector v3X: plastic scintillator, SiPM, Raspberry Pi Pico, OLED, microSD and coincidence mode.',
    ogTitle: 'The v3X Detector | CosmicWatch',
    heading: 'CosmicWatch v3X: The Desktop Muon Detector',
    subTitle:
      'A compact, low-cost and portable device for detecting ionizing radiation, including cosmic-ray muons. The scintillator, SiPM, custom electronics, OLED display, environmental sensors and microSD storage fit in a case the size of a deck of cards, powered from any USB port.',
    buildBtn: 'Build',
    buyBtn: 'Buy',
    insideTitle: 'What’s on the Board?',
    galleryTitle: 'Renders and Photos',
  },

  people: {
    heading: 'Project Members',
    subTitle:
      'The team behind the CosmicWatch project in AxLab at the University of Delaware.',
  },

  shop: {
    title: 'Shop',
    metaDescription:
      'Assembled CosmicWatch detectors, detector kits built around a pre-populated circuit board, circuit boards and plastic scintillators.',
    ogTitle: 'Shop | CosmicWatch',
    heading: 'Shop',
    subTitle:
      'Choose how much of the detector you want to build yourself, from a ready-to-use detector to a single part.',
    includes: 'Includes',
    priceOnRequest: 'Price on request',
    buy: 'Buy',
    opensStore: (store: string) => `(opens ${store} in a new tab)`,
    soon: 'Available soon',
  },

  github: {
    title: 'Downloads',
    metaDescription:
      'Download the CosmicWatch GUI, firmware and data scripts. Everything comes straight from the CosmicWatch v3X GitHub repository.',
    ogTitle: 'Downloads | CosmicWatch',
    heading: 'Downloads',
    subTitle:
      'All supplementary materials, including the firmware, the GUI and the Python script that records data to your computer, can be found in the GitHub repository.',
  },

  data: { faqs, features },
};
