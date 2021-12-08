#! /bin/bash
# MakeFile for creating COOEE corpus repo
BASE_TEMP_DIR=temp
REPO_OUT_DIR=./ocfl-repo
BASE_DATA_DIR=./cooee-attachments

REPO_NAME=ATAP
NAMESPACE=cooee-corpus
TEMP_DIR=${BASE_TEMP_DIR}

.DEFAULT_GOAL := repo

repo :
	node index.js -r "${REPO_OUT_DIR}" \
	-t "${BASE_DATA_DIR}" -n ${REPO_NAME} \
	-p "${TEMP_DIR}" \
	-s ${NAMESPACE} -x "${BASE_DATA_DIR}"/COOEE_contents.xlsx


clean :
	rm -rf ${TEMP_DIR}
	rm -rf ${REPO_OUT_DIR}
