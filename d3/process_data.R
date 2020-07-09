library(googlesheets4)
library(dplyr)
library(tidyverse)
library(cr)
library(here)

raw_data <- read_sheet('https://docs.google.com/spreadsheets/d/1A7GMCRegwtXAF4PuFBjPPXu4BmJijOIsu7-a3gdEsBY/edit#gid=0')

data <- raw_data %>% 
  janitor::clean_names() %>% 
  # right now, this is a proxy for the 'strikethrough' values
  filter(!is.na(us_yes_no)) %>% 
  mutate(refund = factor(refund, levels = c("Automatic", "Optional", "Unknown", "None")),
         status_rescheduled_postponed_cancelled = as.factor(status_rescheduled_postponed_cancelled),
         genre = ifelse(is.na(genre), "Other", genre),
         genre = as.factor(genre),
         us_yes_no = as.factor(us_yes_no)) %>% 
  select(date, status_rescheduled_postponed_cancelled, artist_festival_name, genre, us_yes_no, refund)

processed <- data %>% group_by(date) %>% 
  mutate(index = row_number()) 

write.csv(processed, here('d3/processed.csv'), row.names = FALSE)
