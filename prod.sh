#! /bin/sh
# Run COOEE corpus tool in uat or production mode

REPO_SCRATCH_DIR=/opt/storage/oni/scratch-ocfl
REPO_OUT_DIR=/opt/storage/oni/ocfl

BASE_DATA_DIR=./cooee-attachments
REPO_NAME=LDaCA
NAMESPACE=corpus-of-oz-early-english
NAMESPACE=doi10.26180%2F23961609

node index.js -r "${REPO_OUT_DIR}" \
        -t "${BASE_DATA_DIR}" -n ${REPO_NAME} \
        -s ${NAMESPACE} -x "${BASE_DATA_DIR}"/COOEE.XLS \
        --vm "./node_modules/ro-crate-modes/modes/comprehensive-ldac.json" \
        -z "${REPO_SCRATCH_DIR}"
