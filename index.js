const {Collector} = require("oni-ocfl");
const {languageProfileURI} = require("language-data-node-tools");
const XLSX = require('xlsx');

const extraContext = {
 "register": "http://w3id.org/meta-share/meta-share/register"
}

const classes = [
  {"@id": "#class_I", "name": "Upper Class", "description": " Nobility, university education, government service; Parliaments and Committees", "@type": "Concept"},
  {"@id": "#class_II", "name": "Upper Middle Class", "description": " educated citizens, gentlemen", "@type": "Concept"},
  {"@id": "#class_III", "name": "Lower Middle Class", "description": " free settlers with little education", "@type": "Concept"},
  {"@id": "#class_IIII", "name": "Lower Class", "description": " convicts, labourers, uneducated people, servants", "@type": "Concept"}
  ]
  
  
const registers = [
  {"@id": "#register_SB", "name": "Speech Based", "@type": "Concept"},
  {"@id": "#register_PrW", "name": "Private Written", "@type": "Concept"},
  {"@id": "#register_PcW", "name": "Public Written", "@type": "Concept"},
  {"@id": "#register_GE", "name": "Government English", "@type": "Concept"}
  ]


async function main() {
  const coll = new Collector(); // Get all the paths etc from commandline
  await coll.connect();
  // Make a base corpus using template
  const corpus = coll.newObject(coll.templateCrateDir);

  const corpusCrate = corpus.crate;
  corpusCrate.a
  corpusCrate.addProfile(languageProfileURI("Collection"));
  const corpusRoot = corpus.rootDataset;
  corpus.mintArcpId("corpus","root");
  for (let register of registers) {
    corpusCrate.addItem(register);
  }
  for (let cl of classes) {
    corpusCrate.addItem(cl);
  }




  var workbook = await XLSX.readFile(coll.excelPath, { cellDates: true });
  var bibsheet = workbook.Sheets[workbook.SheetNames[1]];

  const bibData = XLSX.utils.sheet_to_json(bibsheet, {raw: false});
  // Decode publications
  const citedNames = {};
  for (const pub of bibData) {
    //console.log(pub)
    if (pub.Author) {
      const authorName = pub.Author.replace(/,.*/,"").replace(/ /g, "_");
      const work = {
        "@type": "CreativeWork",
        author: pub.Author,
        datePublished: pub.Date,
        name: pub.Title,
        publisher: pub.Source,
        wordCount: pub["Words CEEA"],
        "@id": corpusCrate.arcpId(corpus.namespace, "work", `${authorName}${pub.Date}`)
      }
      corpusCrate.addItem(work);
      citedNames[authorName] = work;
      //console.log(work["@id"], corpusCrate.getItem(work["@id"]))
    }
  }
    //console.log(citedNames);
    
    var worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = XLSX.utils.sheet_to_json(worksheet, {raw: false, range: 1});
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
      const id = corpusCrate.arcpId(corpus.namespace, "item", input["Nr"]);
      const authorID = `${input.Name.replace(/[, ]+/, "_")}`;



      const author = {
        "@id": corpusCrate.arcpId(corpus.namespace, "author", authorID),
        "@type": "Person",
        "name": input.Name,
        "birthDate": input.Birth,
        "birthPlace": input.Origin,
        "gender": input["Gender_1"],
        "immigration": input.Arrival
      }


      const authorProxy = JSON.parse(JSON.stringify(author));
      authorProxy["@id"] = `${authorProxy["@id"]}-${input.Nr}-status`;
      authorProxy.name =  `${input.Name} - status ${date} text #${input.Nr}`;
      authorProxy["age"] = input.Age;
      authorProxy["sameAs"] = { "@id": author["@id"]};
      authorProxy.class = {"@id": `#class_${input["Status_1"]}`};

      // TODO - Addressees



      const file = {
        "@id": `data/${input.Nr}.txt`,
        "@type": "File"
      }
      const plain = {
        "@id": `data/${input.Nr}-plain.txt`,
        "@type": ["File", "OrthographicText"]
      }
      // TODO - sort out citations for federation debates

      var citedId = corpusCrate.arcpId(corpus.namespace, "work", input.Source.replace(", ", "").replace(/ /g, "_"))
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

      

      const item = {
        "@id": id,
        "@type": ["RepositoryObject", "OrthographicText"],
        "name": `Text ${input.Nr} ${date} ${author.name}`,
        "author" : {"@id": authorProxy["@id"]},
        "dateCreated": date,
        "register": {"@id": `#register_${input.Register}`},
        "hasFile": [file, plain],
        "citation": {"@id": citationStubId}
      };

      const citationStub = {
        "@type": "Article",
        "partOf": {"@id": citedId},
        "name": input.Source,
        "@id": citationStubId,
        "wordCount": input["# of words"]
      };

     
      // 
      if (input.Pages != "x") {
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

      
   

      corpusCrate.addItem(item);
      corpusCrate.addItem(citationStub);
      corpusCrate.addItem(file);
      corpusCrate.addItem(plain);

      corpusRoot.hasPart.push(file);
      corpusRoot.hasPart.push(plain);

      corpusCrate.addItem(author);
      corpusCrate.addItem(authorProxy);
      
      corpusRoot.hasMember.push({"@id": item["@id"]});


    }
    corpusRoot.hasMember.sort((a,b)=>(
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