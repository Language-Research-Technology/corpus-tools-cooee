const {ROCrate, Provenance} = require('language-data-node-tools');
const {program} = require('commander');
program.version('0.0.1');
const fs = require("fs-extra");
const _ = require("lodash");
const oniOcfl = require("oni-ocfl");
const tmp = require('tmp');
const path = require('path');
const XLSX = require('xlsx');
const { arcpId } = require('oni-ocfl');
const { Dirent, copyFile } = require('fs');


const prov = new Provenance();

program.version('0.0.1');

async function connectRepo(repoPath) {
  const repo = await oniOcfl.connectRepo(repoPath);
  return repo;
}

// hand-coded the coding tables from COOEE.xls

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

// TODO - move this to a corpus-tools library for reuse
  async function getFile(file, templateDir, corpusCrateDir) {
    srcPath = path.join(templateDir, file["@id"]);
    destPath = path.join(corpusCrateDir, file["@id"]);
    //console.log("Copying", srcPath, destPath)
    await fs.ensureFile(destPath);
    try {
      await fs.ensureFile(destPath);
      await fs.copyFile(srcPath, destPath);
      //console.log("Copied file", srcPath);

    }
    catch(e) {
      console.log(e)
    }
  }


async function main() {
  
  program.option('-r, --repo-path <type>', 'Path to OCFL repository')
  .option('-n, --repo-name <type>', 'Name of OCFL repository')
  .option('-s, --namespace <ns>', 'namespace for ARCP IDs')
  .option('-t, --template <dirs>', 'RO-Crate directory on which to base this the RO-Crate metadata file will be used as a base and any files copied in to the new collection crate')
  .option('-d --data-dir <dirs>', "Directory of data files")
  .option('-p --temp-path <dirs>', 'Temporary Directory Path')
  .option('-x --excel <file>', 'Excel file')

    program.parse(process.argv);
    const opts = program.opts();
    const repoPath = opts.repoPath;
    const repoName = opts.repoName;
    const dataDir = opts.dataDir;
    const namespace = opts.namespace; 
    const templateDir = opts.template; 
    const tempDirPath = opts.tempPath || 'temp';
    const filename = opts.excel;
    if(!namespace) {
      console.error('Please input namespace for ARCP IDs');
      process.exit(-1);
    }

    const repo = await connectRepo(repoPath);

    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath);
    }
    console.log(`Writing temp output in: ${tempDirPath} it may not be gracefully deleted`);
    const tmpobj = tmp.dirSync({tmpdir: tempDirPath});
    const corpusCrateDir = tmpobj.name;

 
    const inputFile = path.join(templateDir, "ro-crate-metadata.json");
    const corpusCrate = new ROCrate(JSON.parse(fs.readFileSync(inputFile)));
    corpusCrate.index();

    for (let register of registers) {
      corpusCrate.addItem(register);
    }
    for (let cl of classes) {
      corpusCrate.addItem(cl);
    }
    const corpusRoot = corpusCrate.getRootDataset();
    const  corpusID = corpusCrate.arcpId(namespace, "root", "description");
    corpusRoot.identifier = corpusID;
    corpusRoot.hasPart = [];
    corpusRoot.hasMember = [];
    corpusRoot["@type"] = ["Collection", "Dataset"];



    var workbook = await XLSX.readFile(filename, { cellDates: true });
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
          "@id": corpusCrate.arcpId(namespace, "work", `${authorName}${pub.Date}`)
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
      const id = corpusCrate.arcpId(namespace, "item", input["Nr"]);
      const authorID = `${input.Name.replace(/[, ]+/, "_")}`;



      const author = {
        "@id": corpusCrate.arcpId(namespace, "author", authorID),
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
        "@type": "File"
      }
      // TODO - sort out citations for federation debates

      var citedId = corpusCrate.arcpId(namespace, "work", input.Source.replace(", ", "").replace(/ /g, "_"))
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
        "@type": ["RepositoryObject", "Article"],
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
        await getFile(item, templateDir, corpusCrateDir)
      }
    }

    const rocrateFile = path.join(corpusCrateDir, "ro-crate-metadata.json");
    corpusCrate.addIdentifier({name: repoName, identifier: corpusRoot.identifier});
    corpusCrate.addLgProfile("Collection");
    corpusCrate.addProvenance(prov);
    await fs.writeFileSync(rocrateFile, JSON.stringify(corpusCrate.getJson(), null, 2));
    const resp =  await oniOcfl.checkin(repo, repoName, corpusCrateDir, corpusCrate, "md5", "ro-crate-metadata.json")

    console.log(`Wrote crate ${corpusCrateDir} : ${resp}`);
    console.log(`Deleting temporary directory ${tempDirPath}`);
    fs.rmSync(tempDirPath, { recursive: true, force: true });
    tmp.setGracefulCleanup();

  } 

main();