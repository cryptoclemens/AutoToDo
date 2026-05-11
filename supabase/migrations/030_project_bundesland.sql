ALTER TABLE projects ADD COLUMN IF NOT EXISTS bundesland TEXT
  CHECK (bundesland IN ('BW','BY','BE','BB','HB','HH','HE','MV','NI','NW','RP','SL','SN','ST','SH','TH'));
