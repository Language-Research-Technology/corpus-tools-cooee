cooee:
	rm -rf ./temp 
	rm -rf ../cooee-repo
	node index.js -r ../cooee-repo -t cooee-attachments -n cooee -s cooee-corpus -x cooee-attachments/COOEE_contents.xlsx
	