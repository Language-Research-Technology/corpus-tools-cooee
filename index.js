const { Collector, generateArcpId } = require("oni-ocfl");
const { languageProfileURI, Languages, Vocab } = require("language-data-commons-vocabs");
const XLSX = require('xlsx');
//const ExcelJS = require('exceljs');
const { DataPack } = require('@ldac/data-packs');
const { default: fsExtra } = require("fs-extra");
const fs = require("fs");
const path = require("path");

// Some terms borrowed from elsewhere - more get added below for local custom properties
const extraContext = {
  "register": "http://w3id.org/meta-share/meta-share/register"
  //"TextType": "http://w3id.org/meta-share/meta-share/TextType",
  //"period": "http://purl.org/dc/terms/Period"
}

// const periods = [
//   { "@id": "#period_1", "name": "Period 1 (1788-1825)", "@type": "DefinedTerm", "start": "1788", "end": "1825" },
//   { "@id": "#period_2", "name": "Period 2 (1826-1850)", "@type": "DefinedTerm", "start": "1826", "end": "1850" },
//   { "@id": "#period_3", "name": "Period 3 (1851-1875)", "@type": "DefinedTerm", "start": "1851", "end": "1875" },
//   { "@id": "#period_4", "name": "Period 4 (1876-1900)", "@type": "DefinedTerm", "start": "1876", "end": "1900" }
// ]
const periods = ['', '1788/1825', '1826/1850', '1851/1875', '1876/1900'];

const definedTermSets = [
  { "@id": "#Registers", "name": "Registers", "@type": "DefinedTermSet" },
  { "@id": "#TextTypes", "name": "Text Types", "@type": "DefinedTermSet" },
  { "@id": "#SocialClasses", "name": "Social Classes", "@type": "DefinedTermSet" }
];
const socialClasses = [
  {
    "@id": "#SocialClass_I",
    "name": "Upper Class",
    "description": " Nobility, university education, government service; Parliaments and Committees",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#SocialClasses" }
  },
  {
    "@id": "#SocialClass_II",
    "name": "Upper Middle Class",
    "description": " educated citizens, gentlemen",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#SocialClasses" }
  },
  {
    "@id": "#SocialClass_III",
    "name": "Lower Middle Class",
    "description": " free settlers with little education",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#SocialClasses" }
  },
  {
    "@id": "#SocialClass_IV",
    "name": "Lower Class",
    "description": " convicts, labourers, uneducated people, servants",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#SocialClasses" }
  }
];
const registers = [
  {
    "@id": "#Register_SB",
    "name": "Speech Based",
    "description": "Material based on transcription or representation of spoken language",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#Registers" }
  },
  {
    "@id": "#Register_PrW",
    "name": "Private Written",
    "description": "Material written for an audience personally known to the writer and not intended for publication",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#Registers" }
  },
  {
    "@id": "#Register_PcW",
    "name": "Public Written",
    "description": "Material written for the general public or for some person who was not a friend of the writer, with publication a possibility",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#Registers" }
  },
  {
    "@id": "#Register_GE",
    "name": "Government English",
    "description": "Material written for use in the activity of government",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#Registers" }
  }
];
const textTypes = [
  {
    "@id": "#TextType_MI",
    "name": "Minutes",
    "description": "Testimony, Hansard, Minutes",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_PL",
    "name": "Play",
    "description": "A planned, creative, rendition of discourse with two or more participants intended for presentation to an audience.",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_SP",
    "name": "Speeches",
    "description": "Addresses, Sermons, Speeches in Assemblies",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_DI",
    "name": "Diaries",
    "description": "Diary, Journal",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_PC",
    "name": "Private Correspondence",
    "description": "personal letters",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_MM",
    "name": "Memoirs",
    "description": "Personal Memoirs",
    "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_NB",
    "name": "Newspapers & Broadsides",
    "description": "Periodicals, Broadsides, Magazines",
    "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_NV",
    "name": "Narratives",
    "description": "Novels and short stories",
    "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_OC",
    "name": "Official Correspondence",
    "description": "To Office Bearers, Letters to the Editor, Pastorals, Business Letters",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_RP",
    "name": "Reports",
    "description": "Histories, Accounts, Statements, Essays",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_VE",
    "name": "Verse",
    "description": "writing arranged with a metrical rhythm, typically having a rhyme",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_IC",
    "name": "Imperial Correspondence",
    "description": "Among Office Bearers, Orders",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_LG",
    "name": "Legal English",
    "description": "Laws, Verdicts, Grants, Contracts, Regulations, reports of court proceedings (but not minutes)",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  },
  {
    "@id": "#TextType_PP",
    "name": "Petitions & Proclamations",
    "description": "Petitions, Proclamations, Resolutions, Official Recommendations",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#TextTypes" }
  }
];

const lingGenreMap = {
  MI: "Informational",
  PL: "Drama",
  SP: "Oratory",
  DI: "Narrative",
  PC: "Informational",
  MM: "Narrative",
  NB: "Informational",
  NV: "Narrative",
  OC: "Informational",
  RP: "Report",
  VE: "Formulaic",
  IC: "Informational",
  LG: "Informational",
  PP: "Informational"
};

const authorType = {
  "Bench of Magistrates": "Organization",
  "Legislative Council": "Organization",
  "Colonial Secretary's Office": "Organization",
  "Committee on Immigration": "Organization",
  "Select Committee on Crown Lands": "Organization",
  "Select Committee on General Grievances": "Organization",
  "Select Committee on Minimum Upset Price of Land": "Organization",
  "Legislative Council of NSW": "Organization",
  "Gold Fields Commission": "Organization",
  "Catholic Bishops of NSW": "Organization",
  "Labour Defence Committee": "Organization",
  "Australian Natives' Association": "Organization",

  "Sydney Gazette": "Author on behalf of",
  "Broadside": "Author on behalf of",
  "Hobart Town Gazette": "Author on behalf of",
  "Convicts": "Author on behalf of",
  "Settlers of VDL": "Author on behalf of",
  "Sydney Monitor": "Author on behalf of",
  "Colonial Times": "Author on behalf of",
  "Sydney Herald": "Author on behalf of",
  "Western Australian Colonial News": "Author on behalf of",
  "Van Diemen's Land Monthly": "Author on behalf of",
  "Sydney Morning Herald": "Author on behalf of",
  "The Australian": "Author on behalf of",
  "Port Phillip Patriot": "Author on behalf of",
  "Port Phillip Patriot and Melbourne Advertiser": "Author on behalf of",
  "South Australian": "Author on behalf of",
  "Australia Felix Monthly": "Author on behalf of",
  "The Argus": "Author on behalf of",
  "Geelong Advertiser": "Author on behalf of",
  "The Age": "Author on behalf of",
  "Inter-Colonial Conference": "Author on behalf of",
  "The Ballarat Courier": "Author on behalf of",
  "Pelham Reports": "Author on behalf of",
  "The Freeman's Journal": "Author on behalf of",
  "The Boomerang": "Author on behalf of",
  "The Bulletin": "Author on behalf of",
  "Woman's World": "Author on behalf of",
  "The Worker": "Author on behalf of",
  "Leichhardt and Petersham Guardian": "Author on behalf of",
  "Table Talk": "Author on behalf of",
  "The Australian Workman": "Author on behalf of",
  "Kalgoorli Miner": "Author on behalf of",
  "Residents of Eastern Goldfields": "Author on behalf of",
  "Woman's Sphere": "Author on behalf of",

  "Petition of Gentlemen": "Authors of",
  "Janus Trial": "Authors of",
  "Statutes At Large": "Authors of",
  "Legislative Act": "Authors of",
  "Regulations": "Authors of",
  "Petition": "Authors of",
  "Minute Book": "Authors of",
  "Agreement": "Authors of",
  "Report of Inquiry": "Authors of",
  "Royal Commission": "Authors of",
  "Constitution of Workers' Union": "Authors of",
  "Manual": "Authors of",
  "Act of Parliament": "Authors of",
  "The Constitution": "Authors of",
  "Law Reports": "Authors of"
};

/**
 * Return the start and end year implied by an approximate indicator of year.
 *
 * Information about these historical documents is often uncertain: this is indicated
 * with decade approximations like 185X for the 1850's.
 */
function handleUncertainYear(yearExpression) {
  yearExpression = yearExpression.toUpperCase();
  if (yearExpression === "?") {
    return [ , , ];
  } else if (typeof yearExpression === 'string' && yearExpression.endsWith("X")) {
    return [
      yearExpression,
      yearExpression.replace('X', '0'),
      yearExpression.replace('X', '9')
    ];
  } else if (typeof yearExpression === 'string' && yearExpression.includes("/")) {
    const [start, end] = yearExpression.split("/");
    return [yearExpression, start, end];
  } else {
    return [yearExpression, yearExpression, yearExpression];
  }
}

async function main() {
  const vocab = new Vocab;
  await vocab.load();
  let datapack = new DataPack({ dataPacks: ['Glottolog'], indexFields: ['name'] });
  await datapack.load();
  let engLang = datapack.get({
    field: "name",
    value: "English",
  });
  const coll = await Collector.create(); // Get all the paths etc from commandline
  //await coll.connect();
  // Make a base corpus using template
  const corpus = coll.newObject(coll.templateCrateDir);

  const corpusCrate = corpus.crate;

  function getEntityRef(id) {
    if (corpusCrate.hasEntity(id)) return { '@id': id };
  }

  // Make custom properties
  // Add some extra cont properties that are specific to this data set
  // These are not in the standard vocab, so we need to add them here
  const extraProperties = {
    birthDateEstimateStart: 'The start of the range of possible birth dates for a person - this is used when the birth date field was specified to the decade like 188x',
    birthDateEstimateEnd: 'The end of the range of possible birth dates for a person - this is used when the birth date field was specified to the decade like 188x',
    arrivalDate: 'Date of arrival in Australia. ',
    arrivalDateEstimateStart: 'The start of the range of possible arrival dates for a person',
    arrivalDateEstimateEnd: 'The end of the range of possible arrival dates for a person',
    //bornInAustralia: 'Whether the person was born in Australia, If they were born in Australia the arrival year is the year they are born',
    yearsLivedInAustralia: 'The number of years the person lived in Australia. It can also contain "nv" for native, meaning that the person was born in Australia, or "un" for unknown.',
    //age: 'The age of the person at the time of the text',
    socialClass: 'The social class of the person at the time of the text',
    //register: 'The type of register the text was taken from',
    textType: 'The type of text'
  };

  const localTermPrefix = generateArcpId(coll.namespace, "terms#");

  for (const propName in extraProperties) {
    const propId = localTermPrefix + propName;
    // Add the prop id to the context 
    //extraContext[propName] = propId;
    // Add the custom props to the crate 
    corpusCrate.addEntity({
      '@id': propId,
      '@type': 'rdf:Property',
      'rdfs:label': propName,
      'rdfs:comment': extraProperties[propName]
    });
  }
  corpusCrate.getEntity(localTermPrefix + 'socialClass').range = { "@id": "#SocialClasses" };
  corpusCrate.getEntity(localTermPrefix + 'textType').range = { "@id": "#TextTypes" };

  // TODO need some tools for all this
  //corpusCrate.addCntext(vocab.getContext());
  extraContext.local = localTermPrefix
  corpusCrate.addContext(extraContext);

  dataDir = corpusCrate.getItem("data/");

  corpusCrate.addProfile(languageProfileURI("Collection"));

  const corpusRoot = corpus.rootDataset;
  corpusRoot["@type"] = ["Dataset", "RepositoryCollection"];
  corpus.mintArcpId();
  for (let dts of definedTermSets) {
    corpusCrate.addEntity(dts);
  }
  for (let register of registers) {
    corpusCrate.addEntity(register);
  }
  for (let texttype of textTypes) {
    corpusCrate.addEntity(texttype);
  }
  // for (let place of places) {
  //   corpusCrate.addEntity(place);
  // }
  for (let sc of socialClasses) {
    corpusCrate.addEntity(sc);
  }
  // for (let period of periods) {
  //   corpusCrate.addEntity(period);
  // }
  // const wb = new ExcelJS.Workbook();
  // await wb.xlsx.readFile(coll.excelPath);

  var workbook = await XLSX.readFile(coll.excelPath, { cellDates: true });
  var bibsheet = workbook.Sheets[workbook.SheetNames[2]];
  const bibData = XLSX.utils.sheet_to_json(bibsheet, { raw: false });
  corpusRoot.inLanguage = engLang;
  corpusRoot['ldac:subjectLanguage'] = engLang;
  // const supportingDocs = {
  //   "@type": "RepositoryObject",
  //   "conformsTo": { "@id": languageProfileURI("Object") },
  //   datePublished: corpusRoot.datePublished,
  //   name: "COOEE Supporting Documents",
  //   description: "Original Microsoft Excel Data Files and Microsoft Word background document",
  //   "@id": generateArcpId(coll.namespace, "supportingDocuments"),
  //   hasPart: corpusRoot.hasPart
  // }
  // corpusCrate.addValues(corpusRoot, 'hasMember', supportingDocs)
  // Decode publications
  //const citedNames = {};
  const lawsonTitles = {
    'On the Track,': 'track',
    'Verses Popular And Humorous,': 'verses',
    'Over the Sliprails,': 'sliprails',
    'To an Old Mate,': 'mate'
  };
  const citeIdAuthorMap = {
    'Mitchell, Library': 'MitchellLibrary',
    'Calvert Expedition,': 'Calvert',
    'Langloh Parker, K.,': 'Langloh',
    "Letters, Proceedings of the People's Federal Convention at Bathurst,": "LettersFederalConventionBathurst"
  };
  for (const pub of bibData) {
    //console.log(pub)
    if (pub.Author) {
      let pubDate = pub.Date.replace(/[A-Za-z\s]/g, '').replace('-', '/');
      let dateRange = pubDate.split("/");
      if (dateRange.length > 1 && dateRange[1].length === 2) {
        dateRange[1] = dateRange[0].slice(0, 2) + dateRange[1];
        pubDate = dateRange.join("/");
      }
      //handle some odd names as exceptions
      let authorName = citeIdAuthorMap[pub.Author];
      if (pub.Author === 'Lawson, Henry,' && lawsonTitles[pub.Title]) {
        authorName = 'Lawson_' + (lawsonTitles[pub.Title]);
      } else if (pub.Author.startsWith("Federation Debates")) {
        authorName = pub.Author.trim().replace(/,$/, "").replace(/\s+(\d+)/, "").replace(/\s/g, "");
      }
      if (!authorName) authorName = pub.Author.replace(/,.*/, "").trim().replace(/ /g, "");
      const [y1, y2] = pubDate.split('/');
      const id = authorName + (y2 || y1);

      const work = {
        "@type": "CreativeWork",
        author: pub.Author.trim().replace(/,*$/, ''),
        datePublished: pubDate,
        name: pub.Title.replace(/,*$/, ''),
        publisher: pub.Source,
        // wordCount: pub["Words CEEA"],
        "@id": generateArcpId(coll.namespace, "work", id)
      }
      //console.log(work['@id']);
      work.inLanguage = engLang;
      work.subjectLanguage = engLang;
      corpusCrate.addEntity(work);
      //citedNames[authorName] = work;
      // console.log(work["@id"], corpusCrate.getItem(work["@id"]))
    }
  }

  //console.log(citedNames);
  const repositoryObjects = [];
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, range: 1 });
  //console.log(data)
  for (let input of data) {
    //console.log(input)
    //const interviewDate = new Date(input["Date of interview"]).toISOString().replace(/T.*/, "");
    /*
    {
      Nr: '1-001',
      Name: 'Phillip, Arthur',
      Birth: '1738',
      Gender: 'm',
      Origin: 'GB',
      Age: '50',
      Status: 'I',
      Arrival: '1788',
      Abode: '0',
      'Year Writing': '1788',
      'Place Writing': 'A-NSW',
      Register: 'PrW',
      TextT: 'PC',
      '# of words': '951',
      Gender_1: 'm',
      Status_1: 'II',
      Place: 'GB-E',
      Source: 'Niall, 1998',
      Pages: '10-11'
    }
    */

    // TODO: strip asterisks from names
    const date = input["Year Writing"];
    const id = generateArcpId(coll.namespace, "item", input["Nr"]);
    const authorID = `${input.Name.replace(/[, ]+/, "_")}`;
    let bornInAustralia;
    let arrivalDate;
    let [birthDate, birthDateEstimateStart, birthDateEstimateEnd] = handleUncertainYear(input.Birth);
    let arrivalDateEstimateStart = birthDateEstimateStart;
    let arrivalDateEstimateEnd = birthDateEstimateEnd;

    if (input.Arrival === "native") {
      bornInAustralia = true;
    } else if (input.Arrival !== "?") {
      bornInAustralia = false;
      [arrivalDate, arrivalDateEstimateStart, arrivalDateEstimateEnd] = handleUncertainYear(input.Arrival);
    }

    // # Abode: This captures the the number of years lived in Australia *at the time of
    // # writing* - it's a relational property of the author at the time the text was
    // # written/published. Because we now have a born_in_australia flag, the 'nv' marker
    // # is redundant - we'll null it out along with the actual nulls. Also note that
    // # years lived in australia can be inferred from the birth year for those born here,
    // # but I'm not sure if that's comparable to the other estimates, spending birth - 18
    // # years in Australia is very different to spending 18-36 years of age, even if
    // # they're both the same number of years.
    //const yearsLivedInAustralia = input.Abode in { un: '', nv: '' } ? '' : input.Abode;
    const yearsLivedInAustralia = input.Abode;

    // Place entities are defined in the ro-crate-metadata.json file 
    // Note that there are extra places that are in place_writing and author origin, but not in the codification
    const birthPlace = getEntityRef(`#place_${input.Origin.trim().replace(' ', '-')}`);

    const author = {
      "@id": generateArcpId(coll.namespace, "author", authorID),
      "@type": ["Person"],
      // Some entries are annotated with a star - reasons unknown. They do not appear to be a disambiguating marker 
      // for people with the same name as the demographic or other information always lines up.
      name: input.Name.trim().replace('*', ''),
      'birthDate': birthDate,
      'local:birthDateEstimateStart': birthDateEstimateStart,
      'local:birthDateEstimateEnd': birthDateEstimateEnd,
      'birthPlace': birthPlace,
      gender: input.Gender,
      'local:arrivalDate': arrivalDate,
      'local:arrivalDateEstimateStart': arrivalDateEstimateStart,
      'local:arrivalDateEstimateEnd': arrivalDateEstimateEnd,
      //'local:bornInAustralia': bornInAustralia,
      'local:yearsLivedInAustralia': yearsLivedInAustralia
    };
    if (author.name in authorType) {
      if (authorType[author.name] === 'Organization') {
        author['@type'] = 'Organization';
      } else {
        author.name = authorType[author.name] + ' ' + author.name;
        author.description = 'This author may be an organization, but it is unclear in the original data source.';
      }
    }

    const authorProxy = JSON.parse(JSON.stringify(author));
    authorProxy["@type"] = ["Person"];
    authorProxy["@id"] = `${authorProxy["@id"]}-${input.Nr}-status`;
    authorProxy.name = `${author.name} - status ${date} text #${input.Nr}`;
    authorProxy["ldac:age"] = input.Age === 'un' ? '' : input.Age;
    authorProxy['local:socialClass'] = getEntityRef(`#SocialClass_${input.Status}`);
    authorProxy["prov:specializationOf"] = author;

    //console.log(authorProxy);

    // TODO - sort out citations for federation debates
    const sourceMap = {
      'Collins1798': 'Collins1802',
      'Tucker': 'Tucker1845',
      'Corbyn1854': 'Corbyn1970',
      'DecisionsofNSWSupremeCourt': 'DecisionsoftheSupremeCourtofNSW1841',
      'Lawson1900Track': 'Lawson_track1900', //handle 'Lawson, 1900, Track'
      'FederationDebatesAdelaideMarch30': 'FederationDebatesAdelaide1897',
      'FederationDebatesAdelaideMarch28': 'FederationDebatesAdelaide1897',
      'FederationDebatesAdelaideMarch24': 'FederationDebatesAdelaide1897',
      'FederationDebatesMelbourneJan21': 'FederationDebatesMelbourne1898',
      'FederationDebatesMelbourneJan24': 'FederationDebatesMelbourne1898',
      'FederationDebatesSydneyMarch17': 'FederationDebatesSydney1891',
      'FederationDebatesSydneyMarch10': 'FederationDebatesSydney1891',
      'FederationDebatesSydneyMarch16': 'FederationDebatesSydney1891',
      'FederationDebatesSydneyMarch15': 'FederationDebatesSydney1891'
    };
    let citSource = input.Source.replace(/[,\s]+/g, ""); //.replace(/ /g, "_");
    // if (input.Source.match(/Federation Debates/)) {
    //   citSource = input.Source.replace(/, .*/, "");
    // }
    if (sourceMap[citSource]) citSource = sourceMap[citSource];
    var citedId = generateArcpId(coll.namespace, "work", citSource)
    var cited = corpusCrate.hasEntity(citedId);
    if (!cited) {
      console.log("CANNOT FIND REFERENCE", citedId);
    }
    const citationStubId = `${citedId}p${input.Pages}`;
    //console.log(input.Source)
    const citationStub = {
      "@type": "CreativeWork",
      "ldac:materialType": vocab.getVocabItem("PrimaryMaterial"),
      "isPartOf": { "@id": citedId },
      "name": input.Source, //Federation Debates Melbourne, Jan 21
      "@id": citationStubId, // arpcp://.. /Federation_Debates_Melbourne1893p38-234
      "wordCount": input["# of words"]
    };
    const recipient = {
      "@id": `${id.replace("item", "recipient")}`,
      //"@type": ["Person"],
      name: `${input.Nr} Recipient`,
      //"gender": input.AdresseeGender,
      socialClass: getEntityRef(`#SocialClass_${input.Status_1}`),
      homeLocation: getEntityRef(`#place_${input.Place.trim().replace(' ', '-')}`)
    };
    const recipientGender = input.Gender_1.toLowerCase();
    if (recipientGender in { m: '', f: '' }) {
      recipient['@type'] = 'Person';
      recipient.gender = recipientGender;
    } else if (recipientGender === 'fam') {
      recipient['@type'] = 'PeopleAudience';
      recipient.name = `${input.Nr} Family Recipient`;
    }

    const item = {
      "@id": id,
      "@type": ["RepositoryObject"],
      "conformsTo": { "@id": languageProfileURI("Object") },
      identifier: input.Nr,
      "name": `Text ${input.Nr} ${date} ${author.name}`,
      "author": authorProxy,
      "description": `Text ${input.Nr} ${date} ${author.name}`,
      "dateCreated": date,
      "register": { "@id": `#Register_${input.Register}` },
      "textType": { "@id": `#TextType_${input.TextT}` },
      //"period": { "@id": `#period_${input.Nr.replace(/^(\d).+/, "$1")}` },
      temporal: periods[input.Nr.split('-')[0]],
      locationCreated: getEntityRef(`#place_${input['Place Writing'].trim().replace(' ', '-')}`),
      // wordCount: input["# of words"],
      "ldac:linguisticGenre": vocab.getVocabItem(lingGenreMap[input.TextT]),
      datePublished: input.Source.match(/.+(\d{4})/) ? input.Source.replace(/.*(\d{4}).*/, "$1") : date,
      "citation": citationStub
    };
    if (recipient['@type']) {
      item.recipient = recipient;
    }

    const [startInt, endInt] = item.temporal.split('/').map(parseInt);
    const dateInt = parseInt(date);
    if (startInt > date || endInt < date) {
      console.error(item);
      return;
    }

    if (item.register["@id"] === "#Register_SB") {
      item['ldac:communicationMode'] = vocab.getVocabItem("SpokenLanguage")
    } else {
      item['ldac:communicationMode'] = vocab.getVocabItem("WrittenLanguage")
    }

    if (input.Pages !== "x") {
      const pages = input.Pages.split("-");
      const start = pages[0];
      citationStub.pageStart = start;
      const end = pages[1];
      if (pages[1]) {
        if (end.length < start.length) {
          citationStub.pageEnd = start.slice(0, start.length - end.length) + end;
        } else {
          citationStub.pageEnd = end;
        }
      }
      citationStub.name += ` p${input.Pages}`;
    }

    const file = {
      "name": `${item.name} - text with metadata codes`,
      "@id": `data/${input.Nr}.txt`,
      "@type": ["File"],
      "materialType": vocab.getVocabItem("DerivedMaterial"),
      // "communicationMode": vocab.getVocabItem("WrittenLanguage"),
      "ldac:annotationOf": citationStub,
      "inLanguage": engLang,
      "encodingFormat": "text/plain"
    }

    const plain = {
      "name": `${item.name} - text`,
      "@id": `data/${input.Nr}-plain.txt`,
      "@type": ["File"],
      "materialType": vocab.getVocabItem("DerivedMaterial"),
      "ldac:annotationOf": citationStub,
      // "communicationMode": vocab.getVocabItem("WrittenLanguage"),
      "inLanguage": engLang,
      "encodingFormat": "text/plain"
    }

    if (item.register["@id"] === "#Register_SB") {
      file['ldac:communicationMode'] = vocab.getVocabItem("SpokenLanguage");
      plain['ldac:communicationMode'] = vocab.getVocabItem("SpokenLanguage");
    } else {
      file['ldac:communicationMode'] = vocab.getVocabItem("WrittenLanguage")
      plain['ldac:communicationMode'] = vocab.getVocabItem("WrittenLanguage")
    }

    item.inLanguage = engLang;

    //if it has a file it's a data entity, must have a file path relative to root of crate

    if (fs.existsSync(path.join(coll.templateCrateDir, file["@id"]))) {
      item['ldac:indexableText'] = plain;
      item['ldac:mainText'] = plain;
      corpusCrate.addValues(corpusRoot, "hasPart", file);
      corpusCrate.addValues(corpusRoot, "hasPart", plain);
    } else {
      item.description = `${item.description}. This item is not currently available in a digital form.`;
      plain["@type"] = ["CreativeWork"];
      file["@type"] = ["CreativeWork"];
    }

    item.hasPart = [plain, file];

    // corpusCrate.addValues(corpusRoot, "hasPart", file);
    // corpusCrate.addValues(corpusRoot, "hasPart", plain);


    //corpusCrate.addItem(author);
    //corpusCrate.addItem(authorProxy);

    //corpusRoot.hasMember.push({"@id": item["@id"]});
    //corpusCrate.addValues(corpusRoot, 'pcdm:hasMember', item);
    repositoryObjects.push(item);
  }
  repositoryObjects.sort((a, b) => (
    a["@id"].localeCompare(b["@id"]))
  )
  corpusRoot['pcdm:hasMember'] = repositoryObjects;
  //console.log(corpusRoot.toJSON());
  // for (let entity of corpusCrate.entities()) {
  //   if (entity["@type"].includes("File")) {
  //     await corpus.addFile(entity, coll.templateCrateDir, null, false);
  //   }
  // }
  await corpus.addToRepo();
}

main();
