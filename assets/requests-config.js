/* Topic requests run on a Google Form + a Google Sheet. There's no server of our own.
   FORM_ACTION: the form's ".../formResponse" URL.  ENTRY: the form's field ids (entry.NNN).
   BOARD_CSV: the "לוח" tab published to the web as CSV (File › Share › Publish to web).
   Leave these empty and the requests feature shows a "coming soon" state. */
window.REQ_CONFIG={
  FORM_ACTION:'',
  ENTRY:{ topic:'', subject:'', grade:'' },
  BOARD_CSV:''
};
