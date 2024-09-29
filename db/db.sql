CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(255) UNIQUE
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    per_name VARCHAR(255) UNIQUE
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE
);

ALTER TABLE users
ADD COLUMN role_id INT REFERENCES roles(id);


CREATE TABLE rolehaspermission (
    role_id INT REFERENCES roles(id),
    permission_id INT REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);


INSERT INTO roles (id, role_name) VALUES
(1, 'Admin'),
(2, 'Author'),
(3, 'User');

INSERT INTO permissions (id, per_name) VALUES
(1, 'Create Blogs'),
(2, 'Edit Blogs'),
(3, 'Delete Blogs'),
(4, 'View Blogs');


INSERT INTO rolehaspermission (role_id, permission_id) VALUES
(1, 1), 
(1, 2), 
(1, 3), 
(1, 4), 
(2, 2), 
(2, 4),
(3, 4);

ALTER TABLE users
DROP column role

ALTER TABLE users
ADD COLUMN created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP

ALTER TABLE blogs
ADD COLUMN edited_at TIMESTAMP DEFAULT NULL;


