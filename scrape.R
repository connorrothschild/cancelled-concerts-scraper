library(rvest)
library(tidyverse)
library(zoo)

url <- 'https://www.billboard.com/articles/business/touring/9323647/concerts-canceled-coronavirus-list'

webpage <- read_html(url)

webpage

rank_data_html <- html_nodes(webpage, '.article__body')

dates <- rank_data_html %>% 
  html_nodes(., "strong") %>% 
  html_text() %>% 
  as.data.frame() %>% 
  rename('dates' = '.') %>% 
  mutate(dates = as.character(dates),
         dates = str_replace_all(dates, ":", ""),
         dates = str_replace_all(dates, "-", ""),
         dates = str_trim(dates)) %>% 
  filter(str_detect(dates, "[0-9]"))

dates_list <- dates %>% 
  pull(dates)

months <- dates %>% 
  mutate(months = str_replace_all(dates, "[0-9]", ""),
         months = str_trim(months)) %>% 
  pull(months) %>% 
  unique()

texts <- rank_data_html %>% 
  html_nodes(., "p") %>% 
  html_text() %>% 
  as.data.frame() %>% 
  rename('texts' = '.') %>% 
  mutate(texts = as.character(texts)) %>% 
  mutate(texts = str_replace_all(texts, " -", ":"),
         texts = str_replace_all(texts, " –", ":"),
         texts = str_replace_all(texts, "–", ":"),
         texts = str_replace_all(texts, "-", ":"))

texts_w_dates <- texts %>% 
  mutate(date_start = ifelse(str_detect(texts, "^July \\d+:|^June \\d+:|^May \\d+:|^April \\d+:|^March \\d+:|^Feb. \\d+:|^Jan. \\d+:"), 1, 0))

texts_w_dates_final <- texts_w_dates %>% 
  mutate(raw_text = texts) %>% 
  filter(date_start == 1) %>% 
  separate(texts, into = c("date", "text"), sep = ":", fill = 'left', extra = "merge") %>% 
  fill(date) %>% 
  mutate(clean_text_nodates = str_replace_all(text, ":", "-"))

joined <- left_join(texts, texts_w_dates_final, by = c('texts' = "raw_text"))

final <- joined %>% 
  mutate(text = ifelse(is.na(clean_text_nodates), texts, clean_text_nodates)) %>%
  fill(date) %>% 
  mutate(text = str_trim(text)) %>% 
  filter(!str_detect(text, "Cancellations Announced*"),
         !is.na(date),
         !is.na(text),
         text != "") %>% 
  mutate(date = str_replace_all(date, fixed("."), "")) %>% 
  select(date, text)

write.csv(final, "scraped.csv", row.names = FALSE)