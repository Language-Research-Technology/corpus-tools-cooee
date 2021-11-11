#! /bin/bash
# MakeFile for creating COOEE corpus repo
BASE_TEMP_DIR=.

REPO_OUT_DIR=./ocfl-repo

REPO_NAME=ATAP
NAMESPACE=cooee-corpus
TEMP_DIR=${BASE_TEMP_DIR}/temp

.DEFAULT_GOAL := repo

repo :
	node index.js -r ${REPO_OUT_DIR} \
	-t ./cooee-attachments -n ${REPO_NAME} \
	-p ${TEMP_DIR} \
	-s ${NAMESPACE} -x ./cooee-attachments/COOEE_contents.xlsx


clean :
	rm -rf ${TEMP_DIR}
