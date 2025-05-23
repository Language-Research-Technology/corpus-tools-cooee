#! /bin/sh
# MakeFile for creating COOEE corpus repo
# Override BASE_DATA_DIR, REPO_OUT_DIR, BASE_TMP_DIR to point to the location of your datasets

BASE_DATA_DIR=./cooee-attachments
REPO_SCRATCH_DIR=scratch

REPO_OUT_DIR=./ocfl-repo
BASE_TEMP_DIR=temp

REPO_NAME=LDaCA
NAMESPACE=corpus-of-oz-early-english
TEMP_DIR=${BASE_TEMP_DIR}

node index.js -r "${REPO_OUT_DIR}" \
	-t "${BASE_DATA_DIR}" -n ${REPO_NAME} \
	-s ${NAMESPACE} -x "${BASE_DATA_DIR}"/COOEE.XLS \
	-z "${REPO_SCRATCH_DIR}"
# 	--vx --vm "./node_modules/ro-crate-modes/modes/comprehensive-ldac.json"
#	-p "${TEMP_DIR}" \
