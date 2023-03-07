#! /bin/bash
# MakeFile for creating COOEE corpus repo
# Override BASE_DATA_DIR, REPO_OUT_DIR, BASE_TMP_DIR to point to the location of your datasets

BASE_DATA_DIR=./cooee-attachments
REPO_SCRATCH_DIR=scratch

REPO_OUT_DIR=./ocfl-repo
BASE_TEMP_DIR=temp

REPO_NAME=ATAP
NAMESPACE=corpus-of-oz-early-english
TEMP_DIR=${BASE_TEMP_DIR}

.DEFAULT_GOAL := repo

repo :
	node index.js -r "${REPO_OUT_DIR}" \
	-t "${BASE_DATA_DIR}" -n ${REPO_NAME} \
	-p "${TEMP_DIR}" \
	-s ${NAMESPACE} -x "${BASE_DATA_DIR}"/COOEE_contents.xlsx \
	-z "${REPO_SCRATCH_DIR}"

clean :
	rm -rf ${TEMP_DIR}
	rm -rf ${REPO_OUT_DIR}
