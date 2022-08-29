# corpus-tools-cooee

Corpus prep tools for the COOEEE corpus (using the spreadsheet that comes with the corpus)

## Install

Then install
```
npm install
```

## Usage 

```bash
make BASE_DATA_DIR=/cooee/data REPO_OUT_DIR=/your/ocfl-repo BASE_TMP_DIR=/your/temp
```

This will load the pre-prepared RO-Crate in ./cooee-attachments and the data in subfolder data under that, to update the metadata in the RO-Crate, edit the ro-crate-metadata.xlsx file and rebuild the .json file using RO-Crate excel:

```
xlro cooee-attachments
```

## Manual changes

I (Peter Sefton) made some changes to the spreadsheet to make bibliographic references work (the original is there as well)

Only one work from Henry Lawson 1900 was referenced (as Lawson, 1900, track)
