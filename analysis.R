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

set_cr_theme(font = "lato")

data %>% 
  group_by(date) %>% 
  count() %>% 
  ungroup() %>% 
  mutate(cumsum = cumsum(n)) %>% 
  ggplot(aes(x = date, y = n)) +
  geom_line() +
  geom_vline(xintercept = as.POSIXct("2020-03-13"),
             color = 'red', size = 1, linetype = 2) +
  annotate("label", x = as.POSIXct("2020-03-13"), y = 25,
           label = "March 13:\nPresident Trump declares national emergency") +
  labs(x = element_blank(), 
       y = 'Number of events cancelled',
       title = 'Concert cancellations peaked in mid-March') +
  drop_axis()

ggsave(here('outputs/concert_cancellations_raw.jpg'))

data %>% 
  group_by(date) %>% 
  count() %>% 
  ungroup() %>% 
  mutate(cumsum = cumsum(n)) %>% 
  ggplot(aes(x = date, y = cumsum)) +
  geom_line() +
  geom_vline(xintercept = as.POSIXct("2020-03-13"),
             color = 'red', size = 1, linetype = 2) +
  annotate("label", x = as.POSIXct("2020-03-13"), y = 255,
           label = "March 13:\nPresident Trump declares national emergency") +
  drop_axis() +
  labs(x = element_blank(), 
       y = 'Cumulative number of events cancelled',
       title = 'Concert cancellations peaked in mid-March')

ggsave(here('outputs/concert_cancellations_cumulative.jpg'))

data %>% 
  group_by(genre) %>%
  count() %>% 
  ggplot(aes(y = n, x =  reorder(genre, n))) +
  geom_col() +
  # geom_col(aes(fill = genre), show.legend = FALSE) +
  drop_axis("y") +
  fix_bars() +
  labs(x = element_blank(), 
       y = 'Number of events cancelled',
       title = 'Concert cancellations, by genre')

ggsave(here('outputs/by_genre.jpg'))

scale_fill_fixed <- function(...) {
  ggplot2:::manual_scale(
    'fill', 
    values = setNames(c(palette_cr_main['emphasis'], palette_cr_main['blue'], palette_cr_main['red'], palette_cr_main['primary']), 
                      c("Automatic", "Optional", "Unknown", "None")),
    ...
  )
}

data %>% 
  count(refund) %>% 
  mutate(sum = sum(n),
         perc = n/sum) %>% 
  ggplot(aes(x = reorder(refund, perc), y = perc, label = scales::percent(perc))) +
  geom_col(aes(fill = refund), 
           position = 'stack',
           show.legend = FALSE) +
  scale_fill_fixed() +
  scale_y_continuous(expand = ggplot2::expand_scale(mult = c(0, 0.001)), labels = scales::percent_format(accuracy = 1)) +
  labs(x = element_blank(), y = element_blank(), fill = element_blank(),
       title = "The majority of events used opt-in refunds",
       subtitle = "Refund approaches across all events")

ggsave(here('outputs/refund_approaches.jpg'))

data %>% 
  group_by(status_rescheduled_postponed_cancelled) %>% 
  count(refund) %>% 
  ggplot(aes(x = reorder(refund, n), y = n)) +
  geom_col(aes(fill = refund), show.legend = FALSE) +
  coord_flip() +
  facet_wrap(~status_rescheduled_postponed_cancelled, nrow = 3) +
  scale_y_continuous(expand = ggplot2::expand_scale(mult = c(0, 0.001))) +
  drop_axis("y") +
  scale_fill_fixed() +
  labs(y = 'Number of events', x = element_blank(), 
       title = "Cancelled concerts gave more automatic refunds,\nwhile postponed and rescheduled ones were opt-in") +
  theme(strip.background = element_rect(fill = 'white'))

ggsave(here('outputs/refund_approach_by_cancellation_status_raw.jpg'))

data %>% 
  group_by(status_rescheduled_postponed_cancelled) %>% 
  count(refund) %>% 
  mutate(sum = sum(n),
         perc = n/sum) %>% 
  ggplot(aes(x = status_rescheduled_postponed_cancelled, 
             y = perc, 
             label = scales::percent(perc, accuracy = 1))) +
  geom_col(aes(fill = refund), 
           position = position_stack(reverse = TRUE)) +
  coord_flip() +
  scale_y_continuous(expand = ggplot2::expand_scale(mult = c(0, 0.001)), 
                     labels = scales::percent_format(accuracy = 1)) +
  geom_label(position = position_stack(reverse = TRUE, vjust = .5), size = 3.5) +
  scale_fill_fixed() +
  labs(x = element_blank(), y = element_blank(), fill = element_blank(),
       title = "Cancelled concerts gave more automatic refunds,\nwhile postponed and rescheduled ones were opt-in") +
  theme(legend.position = 'top',
        legend.direction = 'horizontal')

ggsave(here('outputs/refund_approach_by_cancellation_status_percent.jpg'))

data %>% 
  filter(genre != "Other",
         genre != "Festival") %>% 
  group_by(genre) %>% 
  count(refund) %>% 
  mutate(sum = sum(n),
         perc = n/sum) %>% 
  ggplot(aes(x = genre, 
             y = perc, 
             label = scales::percent(perc, accuracy = 1))) +
  geom_col(aes(fill = refund), 
           position = position_stack(reverse = TRUE)) +
  coord_flip() +
  scale_y_continuous(expand = ggplot2::expand_scale(mult = c(0, 0.001)), 
                     labels = scales::percent_format(accuracy = 1)) +
  geom_label(position = position_stack(reverse = TRUE, vjust = .5), size = 3.5) +
  scale_fill_fixed() +
  labs(x = element_blank(), y = element_blank(), fill = element_blank(),
       title = "Refund approach, by genre") +
  theme(legend.position = 'top',
        legend.direction = 'horizontal')

ggsave(here('outputs/refund_approach_by_genre.jpg'))

data %>% 
  filter(genre != "Other") %>% 
  mutate(genre = ifelse(genre != "Festival", "Individual Artist", "Festival")) %>% 
  group_by(genre) %>% 
  count(refund) %>% 
  mutate(sum = sum(n),
         perc = n/sum) %>% 
  ggplot(aes(x = genre, 
             y = perc, 
             label = scales::percent(perc, accuracy = 1))) +
  geom_col(aes(fill = refund), 
           position = position_stack(reverse = TRUE)) +
  # coord_flip() +
  scale_y_continuous(expand = ggplot2::expand_scale(mult = c(0, 0.001)), 
                     labels = scales::percent_format(accuracy = 1)) +
  geom_label(position = position_stack(reverse = TRUE, vjust = .5), size = 3.5) +
  scale_fill_fixed() +
  drop_axis('y') +
  labs(x = element_blank(), y = element_blank(), fill = 'Refund decision',
       title = "Individual artists more likely than festivals to provide automatic refunds") +
  guides(fill = guide_legend(reverse = TRUE))

ggsave(here('outputs/refund_approach_by_festival_vs_individual.jpg'))

