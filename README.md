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
