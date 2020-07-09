library(googlesheets4)
library(dplyr)
library(tidyverse)
library(cr)
library(here)

data <- readr::read_csv(here("data/final.csv"))

processed <- data %>% 
  arrange(refund) %>% 
  group_by(date) %>% 
  mutate(index = row_number())

write.csv(processed, here('d3/processed.csv'), row.names = FALSE)
