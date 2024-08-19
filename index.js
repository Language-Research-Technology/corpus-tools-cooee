const { Collector, generateArcpId } = require("oni-ocfl");
const { languageProfileURI, Languages, Vocab } = require("language-data-commons-vocabs");
const XLSX = require('xlsx');
const { DataPack } = require('@ldac/data-packs');

const extraContext = {
  "register": "http://w3id.org/meta-share/meta-share/register",
  "TextType": "http://w3id.org/meta-share/meta-share/TextType",
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
  { "@id": "#place_USA", "name": "USA", "@type": "DefinedTerm" }
]
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
  // TODO need some tools for all this
  corpusCrate.addContext(vocab.getContext());
  corpusCrate.addContext(extraContext);

  dataDir = corpusCrate.getItem("data/");

  corpusCrate.addProfile(languageProfileURI("Collection"));
  const corpusRoot = corpus.rootDataset;
  corpusRoot["@type"] = ["Dataset", "RepositoryCollection"];
  corpus.mintArcpId();
  for (let register of registers) {
    corpusCrate.addItem(register);
  }
  for (let texttype of textTypes) {
    corpusCrate.addItem(texttype);
  }
  for (let place of places) {
    corpusCrate.addItem(place);
  }
  for (let cl of classes) {
    corpusCrate.addItem(cl);
  }

  var workbook = await XLSX.readFile(coll.excelPath, { cellDates: true });
  var bibsheet = workbook.Sheets[workbook.SheetNames[1]];
  const bibData = XLSX.utils.sheet_to_json(bibsheet, { raw: false });

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
      corpusCrate.addItem(work);
      citedNames[authorName] = work;

      //console.log(work["@id"], corpusCrate.getItem(work["@id"]))
    }
  }
  //console.log(citedNames);
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, range: 1 });
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
    const date = input["Year Writing"];
    const id = generateArcpId(coll.namespace, "item", input["Nr"]);
    const authorID = `${input.Name.replace(/[, ]+/, "_")}`;

    const author = {
      "@id": generateArcpId(coll.namespace, "author", authorID),
      "@type": "Person",
      "name": input.Name,
      "birthDate": input.Birth,
      "birthPlace": { "@id": `#place_${input.Origin}` },
      "gender": input["Gender_1"],
      "immigration": input.Arrival
    }

    const authorProxy = JSON.parse(JSON.stringify(author));
    authorProxy["@type"] = ["Person"];
    authorProxy["@id"] = `${authorProxy["@id"]}-${input.Nr}-status`;
    authorProxy.name = `${input.Name} - status ${date} text #${input.Nr}`;
    authorProxy["age"] = input.Age;
    authorProxy.class = { "@id": `#class_${input["Status"]}` };
    authorProxy["prov:specializationOf"] = author["@id"];
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

    const citationStub = {
      "@type": "CreativeWork",
      "materialType": vocab.getVocabItem("PrimaryMaterial"),
      "isPartOf": { "@id": citedId },
      "name": input.Source,
      "@id": citationStubId,
      "wordCount": input["# of words"]
    };
    
    const item = {
      "@id": id,
      "@type": ["RepositoryObject"],
      "conformsTo": { "@id": languageProfileURI("Object") },
      "name": `Text ${input.Nr} ${date} ${author.name}`,
      "author": authorProxy,
      "description":`Text ${input.Nr} ${date} ${author.name}`,
      "dateCreated": date,      
      "register": { "@id": `#register_${input.Register}` },
      "TextType": { "@id": `#texttype_${input.TextT}` },
      "linguisticGenre": vocab.getVocabItem(lingGenreMap[input.TextT]),
      "citation": citationStub
    };

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
      "communicationMode": vocab.getVocabItem("WrittenLanguage"),
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
      "communicationMode": vocab.getVocabItem("WrittenLanguage"),
      "inLanguage": engLang,
      "encodingFormat": "text/plain"
    }

    /*if (item.register["@id"] === "#register_SB")  {
      file.communicationMode = vocab.getVocabItem("SpokenLanguage");
      plain.communicationMode = vocab.getVocabItem("SpokenLanguage");
    } else {
      file.communicationMode = vocab.getVocabItem("WrittenLanguage")
      plain.communicationMode = vocab.getVocabItem("WrittenLanguage")
    }*/

    item.inLanguage = engLang;

    item.indexableText = plain;
    item.hasPart = [plain, file];

    corpusCrate.pushValue(corpusRoot, "hasPart", file);
    corpusCrate.pushValue(corpusRoot, "hasPart", plain);


    //corpusCrate.addItem(author);
    //corpusCrate.addItem(authorProxy);

    //corpusRoot.hasMember.push({"@id": item["@id"]});
    corpusCrate.pushValue(corpusRoot, 'hasMember', item)
  }
  corpusRoot.hasMember.sort((a, b) => (
    a["@id"].localeCompare(b["@id"]))
  )

  for (let item of corpusCrate.getGraph()) {
    /// TODO - change to a new getItemsOfType() when available
    if (corpusCrate.utils.asArray(item["@type"]).includes("File")) {
      await corpus.addFile(item, coll.templateCrateDir);
    }
  }
  await corpus.addToRepo();
}

main();
