export const seedData = `
      INSERT INTO users (first_name, last_name, email, role) VALUES
      ('FName-1', 'LName-1', 'email-1@example.com', 'admin'),
      ('FName-2', 'LName-2', 'email-2@example.com', 'standard'),
      ('FName-3', 'LName-3', 'email-3@example.com', 'standard'),
      ('FName-4', 'LName-4', 'email-4@example.com', 'standard'),
      ('FName-5', 'LName-5', 'email-5@example.com', 'standard');

      INSERT INTO parkings (name) VALUES 
      ('Parking 1'),
      ('Parking 2'),
      ('Parking 3');
    `;

export const dbCleanup = `
  DROP TABLE bookings;
  DROP TABLE users;
  DROP TABLE parkings;
`;
