/* Topic requests run on a Google Form + a Google Sheet. There's no server of our own.
   FORM_ACTION: the form's ".../formResponse" URL.  ENTRY: the form's field ids (entry.NNN).
   BOARD_CSV: the separate board spreadsheet (shared view-only) read as CSV. A QUERY over IMPORTRANGE of the private
   responses sheet counts votes per closed-list topic (נושא, מקצוע, כיתה, קולות). "אחר" free text is never on the board.
   Leave these empty and the requests feature shows a "coming soon" state. */
window.REQ_CONFIG={
  FORM_ACTION:'https://docs.google.com/forms/d/e/1FAIpQLScFhRajUXFd_gkj-E_1K-aeedZvuQkKmnnukMW61VHwws0xFA/formResponse',
  ENTRY:{ topic:'entry.653037141', subject:'entry.2069201374', grade:'entry.1688782250', other:'entry.1126472397' },
  BOARD_CSV:'https://docs.google.com/spreadsheets/d/1d2iDI_56uj1elKYX5MNX5vf_coeK00jbXv8iz488JBo/gviz/tq?tqx=out:csv&gid=0'
};
