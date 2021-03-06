CREATE TABLE users (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    username text not null unique,
    password text not null,
    description text,
    money NUMERIC(15,2),
    date_created TIMESTAMP DEFAULT now() NOT NULL
);