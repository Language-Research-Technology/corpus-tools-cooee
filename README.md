# corpus-tools-cooee

Corpus prep tools for the COOEEE corpus (using the spreadsheet that comes with the corpus)

## Install

Then install

```
npm install
```

## Usage

```bash
make BASE_DATA_DIR=./cooee-attachments REPO_OUT_DIR=/your/ocfl-repo BASE_TMP_DIR=/your/temp
```

This will load the pre-prepared RO-Crate in ./cooee-attachments and the data in subfolder data under that, to update the metadata in the RO-Crate, edit the ro-crate-metadata.xlsx file and rebuild the .json file using RO-Crate excel:

```
xlro cooee-attachments
```

<br>

Alternatively, you can create a `make_run.sh` file and add the following:

```
#!/usr/bin/env bash
make BASE_DATA_DIR=./cooee-attachments \
 REPO_OUT_DIR=/opt/storage/oni/ocfl \
 REPO_SCRATCH_DIR=/opt/storage/oni/scratch-ocfl \
 BASE_TMP_DIR=/opt/storage/temp \
 NAMESPACE=COLLECTION_ID (e.g. doi10.26180%2F23961609)
```

Run `chmod +x make_run.sh` to make the file executable.

To run the file:
`./make_run.sh`

## Manual changes

I (Peter Sefton) made some changes to the spreadsheet to make bibliographic references work (the original is there as well)

Only one work from Henry Lawson 1900 was referenced (as Lawson, 1900, track)

## Running Validation of corpus tools COOEE

This will validate the RO-Crate against ro-crate-validation.xlsx.

To run validation:
`./test.sh` 

For further information about the options in terminal:
```
program.option('-r, --repo-path <type>', 'Path to OCFL repository')
    .option('-n, --repo-name <type>', 'Name of OCFL repository')
    .option('-z, --repo-scratch <ns>', 'Path of the scratch ocfl repo')
    .option('-s, --namespace <ns>', 'namespace for ARCP IDs')
    .option('-c, --collection-name <ns>', 'Name of this collection (if not in template)')
    .option('-x, --excel <file>', 'Excel file')
    .option('--vx, --validate-with-excel [file]', 'Excel file for validation')
    .option('--vm, --validate-with-mode [file]', 'A path or url to the mode file')
    .option('-p, --temp-path <dirs>', 'Temporary Directory Path')
    .option('-t, --template <dirs>', 'RO-Crate directory on which to base this the RO-Crate metadata file will be used as a base and any files copied in to the new collection crate')
    .option('-d, --data-dir <dirs>', "Directory of data files with sub directories '/Sound files' (for .wav) and '/Transcripts' (.csv)")
    .option('-D, --debug <ns>', 'Use this in your collector to turn off some behaviour for debugging')
    .option('-m, --multiple', 'Output multiple Objects rather than a single object')
    .option('--sf [file]', 'Run siegfried on the files in the crate and write the output to a file in the data directory')
```