-- Add theater_id column to Ticket_Prices table if it does not exist
ALTER TABLE `Ticket_Prices`
  ADD COLUMN `theater_id` INT NULL AFTER `type_movie`;

-- Create index for theater_id to speed up lookups
CREATE INDEX `idx_ticket_price_theater_id` ON `Ticket_Prices` (`theater_id`);

-- Create foreign key constraint linking to Theaters table
ALTER TABLE `Ticket_Prices`
  ADD CONSTRAINT `fk_ticket_price_theater`
  FOREIGN KEY (`theater_id`) REFERENCES `Theaters`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Optional: verify data consistency
SELECT
  tp.id,
  tp.type_seat,
  tp.type_movie,
  tp.theater_id,
  th.name AS theater_name
FROM Ticket_Prices tp
LEFT JOIN Theaters th ON th.id = tp.theater_id;

