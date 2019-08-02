CREATE TABLE ad_costs (
    ad text not null unique,
    cost NUMERIC(10,2) not null,
    date_created TIMESTAMP DEFAULT now() NOT NULL
);