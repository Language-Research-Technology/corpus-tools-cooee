# corpus-tools-cooee

Corpus prep tools for the COEEE corpus (using the spreadsheet that comes with the corpus)

## Install

Then install
```
npm install
```
Then add language-data-node-tools

Assuming you have [this](https://github.com/Language-Research-Technology/language-data-node-tools) checked out and done npm link inside its directory
```
npm link language-data-node-tools 
```

## Usage 

To run, try:

```
make
```

This will load the pre-prepared RO-Crate in ./cooee-attachments and the data in subfolder data under that, to update the metadata in the RO-Crate, edit the ro-crate-metadata.xlsx file and rebuild the .json file using RO-Crate excel:

```
xlro cooee-attachments
```

## Manual changes

I (Peter Sefton) made some changes to the spreadsheet to make bibliographic references work (the original is there as well)

Only one work from Henry Lawson 1900 was referenced (as Lawson, 1900, track)
