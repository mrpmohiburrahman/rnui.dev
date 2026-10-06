-- A Reader's saved Demos: one row per Reader, holding a JSON array of Recording ids.
--
-- WHY ONE ROW PER READER AND NOT ONE ROW PER SAVE
--
-- The tidier-looking shape is a `saved_demos` table with a row per (reader, recording) pair.
-- It is worse here, and the reason is a budget rather than a taste. A saved-Demos read is one
-- query per *visitor*, never one query per Recording -- that is the decision which makes D1
-- affordable, and map.md carries it as a constraint because retrofitting it means rewriting the
-- read path rather than adding a column.
--
-- A row per save would make that read O(saves): a Reader who saved 40 Demos costs 40 rows read
-- on every page load, forever, and the per-row count grows with the thing we most want to stay
-- small. D1 bills rows read and rows written, so a viral day multiplies the bill by the average
-- saved set rather than by the number of visitors. A row per Reader makes the read a primary-key
-- point lookup that is one row read whether the Reader saved one Demo or the whole catalogue.
--
-- The usual objection is that a JSON array is not normalised and cannot be queried with SQL
-- indexes. That is true and it does not matter here: nothing queries *across* Readers' saved
-- Demos. The only queries this feature runs are "this Reader's list" and "add/remove this id",
-- and both are exactly the shape a single row serves. `json_each` is available if a membership
-- query is ever genuinely needed.
--
-- `last_seen_at` is deliberately absent. ADR-0013 records that a deleted account's token stays
-- valid for up to an hour, and a stored `last_seen_at` plus a scheduled sweep is the eventual
-- mitigation for that. Adding the column now would be a promise nothing reads or writes yet; a
-- nullable `ALTER TABLE` when the sweep is actually built costs one migration.
--
-- There is no `email` column and there never should be one. `CONTEXT.md` is explicit that a
-- Reader's display name is not stable and is never matched on, and that accounts must be able
-- to link across providers (ticket 08) -- so an email column would be both unusable and wrong.
-- The only identity here is the verified `sub`.

CREATE TABLE saved_demos (
  -- The verified Firebase `sub`. PRIMARY KEY is what makes the read one row.
  reader_uid    TEXT PRIMARY KEY NOT NULL,

  -- JSON array of Recording ids, in the order the Reader saved them. The CHECK keeps it an
  -- array of valid JSON rather than letting a bad write poison the read path forever: a Reader
  -- whose row cannot be parsed would silently read as an empty list.
  recording_ids TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(recording_ids) AND json_type(recording_ids) = 'array'),

  -- ISO-8601 UTC, same spelling as a Recording's `created_at`. Written by the module on every
  -- write; nothing sorts by it yet, and nothing should.
  updated_at    TEXT NOT NULL
) STRICT;