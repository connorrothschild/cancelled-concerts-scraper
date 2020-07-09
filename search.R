library(rvest)
library(tidyverse)
library(stringr)
library(here)

#load data
df <- readr::read_csv(here('data/cleaned.csv'))
  
df <- df %>% 
  mutate(cancellation_text = paste(`Artist/Festival Name`, "covid cancel refund"))

get_first_google_link <- function(name, root = TRUE) {
  url = URLencode(paste0("https://www.google.com/search?q=", name))
  page <- xml2::read_html(url)
  # extract all links
  nodes <- rvest::html_nodes(page, "a")
  links <- rvest::html_attr(nodes, "href")
  # extract first link of the search results
  link <- links[startsWith(links, "/url?q=")][1]
  # clean it
  link <- sub("^/url\\?q\\=(.*?)\\&sa.*$", "\\1", link)
  
  link
}

df <- transform(df, url = sapply(df$cancellation_text, get_first_google_link))

df <- df %>%
  mutate(url = as.character(url),
         article_text = NA)

for (i in 1:nrow(df)) {
  df[i,]$article_text <-
    tryCatch({
      paste(html_text(html_nodes(
        xml2::read_html(df[i,]$url), "p"
      ))[str_detect(html_text(html_nodes(
        xml2::read_html(df[i,]$url), "p"
      )), 'refund')], collapse = " ")
      },
      error = function(e) {
        NA
    }, warning = function(w) {
      NA
    })
}

df <- df %>%
  mutate(
    article_text = as.character(article_text),
    article_text = str_trim(article_text),
    article_text = gsub("[\r\n]", "", article_text),
    article_text = ifelse(url == "https://www.billboard.com/articles/business/touring/9323647/concerts-canceled-coronavirus-list", NA, article_text)
  )

write.csv(df, here('data/cleaned_w_text.csv'))
