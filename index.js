const { Collector, generateArcpId } = require("oni-ocfl");
const { languageProfileURI, Languages, Vocab } = require("language-data-commons-vocabs");
const XLSX = require('xlsx');
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
    "@id": "#SocialClass_IIII",
    "name": "Lower Class",
    "description": " convicts, labourers, uneducated people, servants",
    "@type": "DefinedTerm",
    "inDefinedTermSet": { "@id": "#SocialClasses" }
  }
];
const registers = [
  { "@id": "#Register_SB", "name": "Speech Based", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#Registers" } },
  { "@id": "#Register_PrW", "name": "Private Written", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#Registers" } },
  { "@id": "#Register_PcW", "name": "Public Written", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#Registers" } },
  { "@id": "#Register_GE", "name": "Government English", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#Registers" } }
];
const textTypes = [
  { "@id": "#TextType_MI", "name": "Minutes", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_PL", "name": "Play", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_SP", "name": "Speeches", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_DI", "name": "Diaries", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_PC", "name": "Private Correspondence", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_MM", "name": "Memoirs", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_NB", "name": "Newspapers & Broadsides", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_NV", "name": "Narratives", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_OC", "name": "Official Correspondence", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_RP", "name": "Reports", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_VE", "name": "Verse", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_IC", "name": "Imperial Correspondence", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_LG", "name": "Legal English", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } },
  { "@id": "#TextType_PP", "name": "Petitions & Proclamations", "@type": "DefinedTerm", "inDefinedTermSet": { "@id": "#TextTypes" } }
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
  VE: "Forulaic",
  IC: "Informational",
  LG: "Informational",
  PP: "Informational"
}

/**
 * Return the start and end year implied by an approximate indicator of year.
 *
 * Information about these historical documents is often uncertain: this is indicated
 * with decade approximations like 185X for the 1850's.
 */
function handleUncertainYear(yearExpression) {
  yearExpression = yearExpression.toUpperCase();
  if (yearExpression === "?") {
    return ['', '', ''];
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
  const coll = new Collector(); // Get all the paths etc from commandline
  await coll.connect();
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
    bornInAustralia: 'Whether the person was born in Australia, If they were born in Australia the arrival year is the year they are born',
    yearsLivedInAustralia: 'The number of years the person lived in Australia',
    //age: 'The age of the person at the time of the text',
    socialClass: 'The social class of the person at the time of the text',
    //register: 'The type of register the text was taken from',
    textType: 'The type of text'
  };

  for (const propName in extraProperties) {
    const propId = '#' + propName;
    // Add the prop id to the context 
    extraContext[propName] = propId;
    // Add the custom props to the crate 
    corpusCrate.addEntity({
      '@id': propId,
      '@type': 'rdf:Property',
      'rdfs:label': propName,
      'rdfs:comment': extraProperties[propName]
    });
  }
  corpusCrate.getEntity('#socialClass').range = { "@id": "#SocialClasses" };
  corpusCrate.getEntity('#textType').range = { "@id": "#TextTypes" };

  // TODO need some tools for all this
  //corpusCrate.addCntext(vocab.getContext());
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

  var workbook = await XLSX.readFile(coll.excelPath, { cellDates: true });
  var bibsheet = workbook.Sheets[workbook.SheetNames[1]];
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
  const citedNames = {};
  for (const pub of bibData) {
    //console.log(pub)
    if (pub.Author) {
      const authorName = pub.Author.replace(/,.*/, "").replace(/ /g, "_");
      let pubDate = pub.Date.replace(/[A-Za-z\s]/, '').replace('-', '/');
      let dateRange = pubDate.split("/");
      if (dateRange.length > 1 && dateRange[1].length === 2) {
        dateRange[1] = dateRange[0].slice(0, 2) + dateRange[1];
        pubDate = dateRange.join("/");
      }
      const work = {
        "@type": "CreativeWork",
        author: pub.Author.replace(/,*$/, ''),
        datePublished: pubDate,
        name: pub.Title.replace(/,*$/, ''),
        publisher: pub.Source,
        wordCount: pub["Words CEEA"],
        "@id": generateArcpId(coll.namespace, "work", `${authorName}${pub.Date}`)
      }
      work.inLanguage = engLang;
      work.subjectLanguage = engLang;
      corpusCrate.addEntity(work);
      citedNames[authorName] = work;
      // console.log(work["@id"], corpusCrate.getItem(work["@id"]))
    }
  }
  //console.log(citedNames);
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, range: 1 });
  //console.log(data)
  for (let input of data) {

    // console.log(input)
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
    const date = input["Year Writing"];
    const id = generateArcpId(coll.namespace, "item", input["Nr"]);
    const authorID = `${input.Name.replace(/[, ]+/, "_")}`;
    let bornInAustralia = false;
    let arrivalDate = input.Arrival;
    let [birthDate, birthDateEstimateStart, birthDateEstimateEnd] = handleUncertainYear(input.Birth);
    let arrivalDateEstimateStart = birthDateEstimateStart;
    let arrivalDateEstimateEnd = birthDateEstimateEnd;

    if (arrivalDate === "native") {
      bornInAustralia = true;
      arrivalDate = '';
    } else {
      [arrivalDate, arrivalDateEstimateStart, arrivalDateEstimateEnd] = handleUncertainYear(arrivalDate);
    }

    // # Abode: This captures the the number of years lived in Australia *at the time of
    // # writing* - it's a relational property of the author at the time the text was
    // # written/published. Because we now have a born_in_australia flag, the 'nv' marker
    // # is redundant - we'll null it out along with the actual nulls. Also note that
    // # years lived in australia can be inferred from the birth year for those born here,
    // # but I'm not sure if that's comparable to the other estimates, spending birth - 18
    // # years in Australia is very different to spending 18-36 years of age, even if
    // # they're both the same number of years.
    const yearsLivedInAustralia = input.Abode in { un: '', nv: '' } ? '' : input.Abode;

    // Place entities are defined in the ro-crate-metadata.json file 
    // Note that there are extra places that are in place_writing and author origin, but not in the codification
    // A slash (/) in the Origin, such as A/GB will be converted to multiple places eg [A, GB]
    const origin = input.Origin.split('/').filter(e => e);
    const birthPlace = origin.map(o => getEntityRef(`#place_${o.trim().replace(' ', '-')}`)).filter(e => e);

    const author = {
      "@id": generateArcpId(coll.namespace, "author", authorID),
      "@type": ["Person"],
      // Some entries are annotated with a star - reasons unknown. They do not appear to be a disambiguating marker 
      // for people with the same name as the demographic or other information always lines up.
      name: input.Name.replace('*', ''),
      birthDate,
      birthDateEstimateStart,
      birthDateEstimateEnd,
      birthPlace,
      gender: input.Gender,
      arrivalDate,
      arrivalDateEstimateStart,
      arrivalDateEstimateEnd,
      bornInAustralia,
      yearsLivedInAustralia
    };

    const authorProxy = JSON.parse(JSON.stringify(author));
    authorProxy["@type"] = ["Person"];
    authorProxy["@id"] = `${authorProxy["@id"]}-${input.Nr}-status`;
    authorProxy.name = `${input.Name} - status ${date} text #${input.Nr}`;
    authorProxy["ldac:age"] = input.Age === 'un' ? '' : input.Age;
    authorProxy.socialClass = getEntityRef(`#SocialClass_${input.Status}`);
    authorProxy["prov:specializationOf"] = author["@id"];

    if (!birthDate && !authorProxy.age) {
      author['@type'].push('Organization');
      authorProxy['@type'].push('Organization');
      author.description = authorProxy.description = 'This author may be an organization, but it is unclear in the original data source.';
    }
    //console.log(authorProxy);

    // TODO - sort out citations for federation debates

    var citedId = generateArcpId(coll.namespace, "work", input.Source.replace(", ", "").replace(/ /g, "_"))
    var cited = corpusCrate.getItem(citedId)
    if (!cited) {
      //Not an exact match - lets try just by name
      const authorName = input.Source.replace(/,.*/, "").replace(/ /g, "_").replace(/\d+/, "");
      cited = citedNames[authorName];
      if (!cited) {
        console.log("CANNOT FIND REFERENCE", authorName);
      }
    }
    const citationStubId = `${citedId}p${input.Pages}`;
    //console.log(input.Source)
    const citationStub = {
      "@type": "CreativeWork",
      "materialType": vocab.getVocabItem("PrimaryMaterial"),
      "isPartOf": { "@id": citedId },
      "name": input.Source,
      "@id": citationStubId,
      "wordCount": input["# of words"]
    };
    const recipient = {
      "@id": `${id.replace("item", "recipient")}`,
      //"@type": ["Person"],
      name: `${input.Nr} Recipient`,
      //"gender": input.AdresseeGender,
      socialClass: getEntityRef(`#socialClass_${input.AdresseeStatus}`),
      homeLocation: getEntityRef(`#place_${input.AdresseePlace.trim().replace(' ', '-')}`)
    };
    const recipientGender = input.AdresseeGender.toLowerCase();
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
      temporalCoverage: periods[input.Nr.split('-')[0]],
      locationCreated: getEntityRef(`#place_${input['Place Writing'].trim().replace(' ', '-')}`),
      wordCount: input["# of words"],
      "ldac:linguisticGenre": vocab.getVocabItem(lingGenreMap[input.TextT]),
      "citation": citationStub
    };
    if (recipient['@type']) {
      item.recipient = recipient;
    }

    item.datePublished = input.Source.match(/.+(\d{4})/) ? input.Source.replace(/.+(\d{4})/, "$1") : date;

    const [startInt, endInt] = item.temporalCoverage.split('/').map(parseInt);
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
      "annotationOf": citationStub,
      "inLanguage": engLang,
      "encodingFormat": "text/plain"
    }

    const plain = {
      "name": `${item.name} - text`,
      "@id": `data/${input.Nr}-plain.txt`,
      "@type": ["File"],
      "materialType": vocab.getVocabItem("DerivedMaterial"),
      "annotationOf": citationStub,
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
    corpusCrate.addValues(corpusRoot, 'hasMember', item)
  }
  corpusRoot.hasMember.sort((a, b) => (
    a["@id"].localeCompare(b["@id"]))
  )
  console.log(corpusRoot.toJSON());
  for (let entity of corpusCrate.entities()) {
    if (entity["@type"].includes("File")) {
      await corpus.addFile(entity, coll.templateCrateDir, null, false);
    }
  }
  await corpus.addToRepo();
}

main();
