# corpus-tools-cooee
Corpus prep tools for the COEEE corpus (using the spreadsheet that comes with the corpus)


## Install

npm link language-data-node-tools # Assuming you have this checked ou
npm install https://github.com/Language-Research-Technology/oni-ocfl


## Usage 

To run, try:

```
make cooee
```

This will load the pre-prepared RO-Crate in ./cooee-attachments and the data in subfolder data under that, to update the metadata in the RO-Crate, edit the ro-crate-metadata.xlsx file and rebuild the .json file using RO-Crate excel:

```
xlro cooee-attachments
```


## manual changes

I (Peter Sefton) ade some changes to the spreadsheet to make bibliographic references work

    References to the:

Only one work from Henry Lawson 1900 was referenced (as Lawson, 1900, track)
