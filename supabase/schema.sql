-- Create an enum for predefined categories
create type farming_category as enum (
  'Pest Control',
  'Irrigation',
  'Fertilizer',
  'Harvesting',
  'Planting',
  'Equipment',
  'Weather',
  'Market Prices'
);

-- Create the calls table
create table calls (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamptz default now(),
  transcript text not null,
  summary text not null,
  categories farming_category[] not null,
  sentiment float not null check (sentiment >= -1 and sentiment <= 1)
);

-- Create indexes for better query performance
create index calls_timestamp_idx on calls (timestamp desc);
create index calls_sentiment_idx on calls (sentiment); 