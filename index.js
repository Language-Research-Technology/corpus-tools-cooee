const { Collector, generateArcpId } = require("oni-ocfl");
const { languageProfileURI, Languages, Vocab } = require("language-data-commons-vocabs");
const XLSX = require('xlsx');
const { DataPack } = require('@ldac/data-packs');
const { default: fsExtra } = require("fs-extra");
const fs = require("fs");
const path = require("path");

// Some terms borrowed from elsewhere - more get added below for local custom properties
const extraContext = {
  "register": "http://w3id.org/meta-share/meta-share/register",
  "TextType": "http://w3id.org/meta-share/meta-share/TextType",
  "period": "http://purl.org/dc/terms/Period"
}


const classes = [
  {
    "@id": "#class_I",
    "name": "Upper Class",
    "description": " Nobility, university education, government service; Parliaments and Committees",
    "@type": "DefinedTerm"
  },
  {
    "@id": "#class_II",
    "name": "Upper Middle Class",
    "description": " educated citizens, gentlemen",
    "@type": "DefinedTerm"
  },
  {
    "@id": "#class_III",
    "name": "Lower Middle Class",
    "description": " free settlers with little education",
    "@type": "DefinedTerm"
  },
  {
    "@id": "#class_IIII",
    "name": "Lower Class",
    "description": " convicts, labourers, uneducated people, servants",
    "@type": "DefinedTerm"
  }
];

const classesById = Object.fromEntries(classes.map(c => [c["@id"], c]));

const periods = [
  { "@id": "#period_1", "name": "Period 1 (1788-1825)", "@type": "DefinedTerm", "start": "1788", "end": "1825" },
  { "@id": "#period_2", "name": "Period 2 (1826-1850)", "@type": "DefinedTerm", "start": "1826", "end": "1850" },
  { "@id": "#period_3", "name": "Period 3 (1851-1875)", "@type": "DefinedTerm", "start": "1851", "end": "1875" },
  { "@id": "#period_4", "name": "Period 4 (1876-1900)", "@type": "DefinedTerm", "start": "1876", "end": "1900" }
]

const registers = [
  { "@id": "#register_SB", "name": "Speech Based", "@type": "DefinedTerm" },
  { "@id": "#register_PrW", "name": "Private Written", "@type": "DefinedTerm" },
  { "@id": "#register_PcW", "name": "Public Written", "@type": "DefinedTerm" },
  { "@id": "#register_GE", "name": "Government English", "@type": "DefinedTerm" }
]
const textTypes = [
  { "@id": "#texttype_MI", "name": "Minutes", "@type": "DefinedTerm" },
  { "@id": "#texttype_PL", "name": "Play", "@type": "DefinedTerm" },
  { "@id": "#texttype_SP", "name": "Speeches", "@type": "DefinedTerm" },
  { "@id": "#texttype_DI", "name": "Diaries", "@type": "DefinedTerm" },
  { "@id": "#texttype_PC", "name": "Private Correspondence", "@type": "DefinedTerm" },
  { "@id": "#texttype_MM", "name": "Memoirs", "@type": "DefinedTerm" },
  { "@id": "#texttype_NB", "name": "Newspapers & Broadsides", "@type": "DefinedTerm" },
  { "@id": "#texttype_NV", "name": "Narratives", "@type": "DefinedTerm" },
  { "@id": "#texttype_OC", "name": "Official Correspondence", "@type": "DefinedTerm" },
  { "@id": "#texttype_RP", "name": "Reports", "@type": "DefinedTerm" },
  { "@id": "#texttype_VE", "name": "Verse", "@type": "DefinedTerm" },
  { "@id": "#texttype_IC", "name": "Imperial Correspondence", "@type": "DefinedTerm" },
  { "@id": "#texttype_LG", "name": "Legal English", "@type": "DefinedTerm" },
  { "@id": "#texttype_PP", "name": "Petitions & Proclamations", "@type": "DefinedTerm" }
]
const places = [
  { "@id": "#place_A", "name": "Australia", "@type": "DefinedTerm" },
  { "@id": "#place_A-NSW", "name": "New South Wales", "@type": "DefinedTerm" },
  { "@id": "#place_A-QLD", "name": "Queensland", "@type": "DefinedTerm" },
  { "@id": "#place_A-NT", "name": "Northern Territory", "@type": "DefinedTerm" },
  { "@id": "#place_A-SA", "name": "South Australia", "@type": "DefinedTerm" },
  { "@id": "#place_A-VDL", "name": "Van Diemen's Land", "@type": "DefinedTerm" },
  { "@id": "#place_A-VIC", "name": "Victoria", "@type": "DefinedTerm" },
  { "@id": "#place_A-WA", "name": "Western Australia", "@type": "DefinedTerm" },
  { "@id": "#place_CAN", "name": "Canada", "@type": "DefinedTerm" },
  { "@id": "#place_GB", "name": "Great Britain", "@type": "DefinedTerm" },
  { "@id": "#place_GB-E", "name": "England", "@type": "DefinedTerm" },
  { "@id": "#place_GB-SC", "name": "Scotland", "@type": "DefinedTerm" },
  { "@id": "#place_GB-W", "name": "Wales", "@type": "DefinedTerm" },
  { "@id": "#place_India", "name": "India", "@type": "DefinedTerm" },
  { "@id": "#place_NI", "name": "Northern Ireland", "@type": "DefinedTerm" },
  { "@id": "#place_NZ", "name": "New Zealand", "@type": "DefinedTerm" },
  { "@id": "#place_SA", "name": "South Africa", "@type": "DefinedTerm" },
  { "@id": "#place_SI", "name": "Southern Ireland", "@type": "DefinedTerm" },
  { "@id": "#place_USA", "name": "USA", "@type": "DefinedTerm" },
  // Extra places that are in place_writing and author origin, but not in the codification
  { "@id": "#place_At-Sea", "name": "At Sea", "@type": "DefinedTerm" },
  { "@id": "#place_Norfolk-Island", "name": "Norfolk Island", "@type": "DefinedTerm" },
  { "@id": "#place_Ireland", "name": "Ireland", "@type": "DefinedTerm" },
  { "@id": "#place_Italy", "name": "Italy", "@type": "DefinedTerm" },
  { "@id": "#place_Azores", "name": "Azores", "@type": "DefinedTerm" },
  { "@id": "#place_Germany", "name": "Germany", "@type": "DefinedTerm" },
  { "@id": "#place_British-Guiana", "name": "British Guiana", "@type": "DefinedTerm" },
  { "@id": "#place_Portugal", "name": "Portugal", "@type": "DefinedTerm" },
  { "@id": "#place_A/GB", "name": "Portugal", "@type": "DefinedTerm" } // this may mean Australia and/or GB, what to do? 
];
const placesById = Object.fromEntries(places.map(c => [c["@id"], c]));

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
      return [yearExpression,start, end];
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

  // Make custom properties
  // Add some extra cont properties that are specific to this data set
  // These are not in the standard vocab, so we need to add them here
  const birthDateEstimateEndProp = {  
    "@id": generateArcpId(coll.namespace, "terms", "#birthDateEstimateEnd"),
    "name": "Birth Date Estimate End",
    "description": "The end of the range of possible birth dates for a person - this is used when the birth date field was specified to the decade like 188x",
    "@type": "rdfs:Property"
  }
  extraContext["birthDateEstimateEnd"] = birthDateEstimateEndProp["@id"];

  const birthDateEstimateStartProp = {  
    "@id": generateArcpId(coll.namespace, "terms", "#birthDateEstimateStart"),
    "name": "Birth Date Estimate Start",
    "description": "The start of the range of possible birth dates for a person - this is used when the birth date field was specified to the decade like 188x",
    "@type": "rdfs:Property"
  }
  extraContext["birthDateEstimateStart"] = birthDateEstimateStartProp["@id"];

  


  // Add the custom props to the crate 
  corpusCrate.addEntity(birthDateEstimateEndProp);
  corpusCrate.addEntity(birthDateEstimateStartProp);

  // TODO need some tools for all this
  corpusCrate.addContext(vocab.getContext());
  corpusCrate.addContext(extraContext);

  dataDir = corpusCrate.getItem("data/");

  corpusCrate.addProfile(languageProfileURI("Collection"));





  const corpusRoot = corpus.rootDataset;
  corpusRoot["@type"] = ["Dataset", "RepositoryCollection"];
  corpus.mintArcpId();
  for (let register of registers) {
    corpusCrate.addEntity(register);
  }
  for (let texttype of textTypes) {
    corpusCrate.addEntity(texttype);
  }
  for (let place of places) {
    corpusCrate.addEntity(place);
  }
  for (let cl of classes) {
    corpusCrate.addEntity(cl);
  }
  for (let period of periods) {
    corpusCrate.addEntity(period);
  }

  var workbook = await XLSX.readFile(coll.excelPath, { cellDates: true });
  var bibsheet = workbook.Sheets[workbook.SheetNames[1]];
  const bibData = XLSX.utils.sheet_to_json(bibsheet, { raw: false });
  corpusCrate.inLanguage = engLang;
  corpusCrate.subjectLanguage = engLang;
  const supportingDocs = {
    "@type": "RepositoryObject",
    "conformsTo": { "@id": languageProfileURI("Object") },
    datePublished: corpusRoot.datePublished,
    name: "COOEE Supporting Documents",
    description: "Original Microsoft Excel Data Files and Microsoft Word background document",
    "@id": generateArcpId(coll.namespace, "supportingDocuments"),
    hasPart: corpusRoot.hasPart
  }
  corpusCrate.pushValue(corpusRoot, 'hasMember', supportingDocs)
  // Decode publications
  const citedNames = {};
  for (const pub of bibData) {
    //console.log(pub)
    if (pub.Author) {
      const authorName = pub.Author.replace(/,.*/, "").replace(/ /g, "_");
      const work = {
        "@type": "CreativeWork",
        author: pub.Author,
        datePublished: pub.Date,
        name: pub.Title,
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
    //TODO: define rdf property for date estimate

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
    const yearsLivedInAustralia = input.Abode in {un: '', nv: ''} ? '' : input.Abode;
    const birthPlaceId = `#place_${input.Origin.replace(' ', '-')}`;
    const birthPlace = placesById[birthPlaceId] ? { '@id': birthPlaceId } : '';
    //todo check for A/GB
    const author = {
      "@id": generateArcpId(coll.namespace, "author", authorID),
      "@type": "Person",
      // Some entries are annotated with a star - reasons unknown. They do not appear to be a disambiguating marker 
      // for people with the same name as the demographic or other information always lines up.
      name: input.Name.replace('*', ''),
      birthDate,
      birthDateEstimateStart,
      birthDateEstimateEnd,
      birthPlace,
      "gender": input["Gender"],
      arrivalDate,
      arrivalDateEstimateStart,
      arrivalDateEstimateEnd,
      bornInAustralia,
      yearsLivedInAustralia
    };
    const authorClass = classesById[`#class_${input.Status}`];


    const authorProxy = JSON.parse(JSON.stringify(author));
    authorProxy["@type"] = ["Person"];
    authorProxy["@id"] = `${authorProxy["@id"]}-${input.Nr}-status`;
    authorProxy.name = `${input.Name} - status ${date} text #${input.Nr}`;
    authorProxy["age"] = input.Age === 'un' ? '' : input.Age;
    authorProxy.class = authorClass ?  { "@id": authorClass['@id'] } : '';
    authorProxy["prov:specializationOf"] = author["@id"];

    if (!birthDate && !authorProxy.age) {
      author['@type'].push('Organization'); 
      authorProxy['@type'].push('Organization');
      author.description = authorProxy.description = 'This author may be an organization, but it is unclear in the original data source.';
    }
    console.log(authorProxy);

    // TODO - Addressees


    // TODO - sort out citations for federation debates

    var citedId = generateArcpId(coll.namespace, "work", input.Source.replace(", ", "").replace(/ /g, "_"))
    var cited = corpusCrate.getItem(citedId)
    if (!cited) {
      //Not an exact match - lets try jsut by name
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
      "@type": ["Person"],
      "name": `${input.Nr} Recipient`,
      "gender": input.AdresseeGender,
      "class": { "@id": `#class_${input.AdresseeStatus}` },
      "place": { "@id": `#place_${input.AdresseePlace}` }
    }

    const item = {
      "@id": id,
      "@type": ["RepositoryObject"],
      "conformsTo": { "@id": languageProfileURI("Object") },
      "name": `Text ${input.Nr} ${date} ${author.name}`,
      "author": authorProxy,
      "description": `Text ${input.Nr} ${date} ${author.name}`,
      "dateCreated": date,
      "register": { "@id": `#register_${input.Register}` },
      "TextType": { "@id": `#texttype_${input.TextT}` },
      "period": { "@id": `#period_${input.Nr.replace(/^(\d).+/, "$1")}` },
      "linguisticGenre": vocab.getVocabItem(lingGenreMap[input.TextT]),
      "citation": citationStub
    };
    if (recipient.gender !== "x") {
      console
      item.recipient = recipient;
    }


    item.datePublished = input.Source.match(/.+(\d{4})/) ? input.Source.replace(/.+(\d{4})/, "$1") : date;



    if (item.register["@id"] === "#register_SB") {
      item.communicationMode = vocab.getVocabItem("SpokenLanguage")
    } else {
      item.communicationMode = vocab.getVocabItem("WrittenLanguage")
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

    if (item.register["@id"] === "#register_SB") {
      file.communicationMode = vocab.getVocabItem("SpokenLanguage");
      plain.communicationMode = vocab.getVocabItem("SpokenLanguage");
    } else {
      file.communicationMode = vocab.getVocabItem("WrittenLanguage")
      plain.communicationMode = vocab.getVocabItem("WrittenLanguage")
    }

    item.inLanguage = engLang;

    //if it has a file it's a data entity, must have a file path relative to root of crate
    
    if (fs.existsSync(path.join(coll.templateCrateDir, file["@id"]))) {
      item.indexableText = plain;
      corpusCrate.pushValue(corpusRoot, "hasPart", file);
      corpusCrate.pushValue(corpusRoot, "hasPart", plain);
    } else {
      item.description = `${item.description}. This item is not currently available in a digital form.`;
      plain["@type"] = ["CreativeWork"];
      file["@type"] = ["CreativeWork"];
    }

    item.hasPart = [plain, file];

    // corpusCrate.pushValue(corpusRoot, "hasPart", file);
    // corpusCrate.pushValue(corpusRoot, "hasPart", plain);


    //corpusCrate.addItem(author);
    //corpusCrate.addItem(authorProxy);

    //corpusRoot.hasMember.push({"@id": item["@id"]});
    corpusCrate.pushValue(corpusRoot, 'hasMember', item)
  }
  corpusRoot.hasMember.sort((a, b) => (
    a["@id"].localeCompare(b["@id"]))
  )
  console.log(corpusRoot.toJSON());
  // for (let item of corpusCrate.getGraph()) {
  //   /// TODO - change to a new getItemsOfType() when available
  //   if (corpusCrate.utils.asArray(item["@type"]).includes("File")) {
  //     await corpus.addFile(item, coll.templateCrateDir, null, false);
  //   }
  // }
  // await corpus.addToRepo();
}

main();
