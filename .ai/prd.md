# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu

10xCards to webowa aplikacja do szybkiego generowania i zarządzania fiszkami edukacyjnymi. Dzięki integracji AI (Openrouter.ai) i prostemu interfejsowi użytkownika, pozwala tworzyć fiszki z wklejanego tekstu lub ręcznie, organizować je oraz korzystać z gotowego algorytmu powtórek.

## 2. Problem użytkownika

Ręczne tworzenie wysokiej jakości fiszek jest czasochłonne i zniechęca do korzystania z efektywnej metody nauki jaką jest spaced repetition. Użytkownicy potrzebują narzędzia, które automatyzuje część pracy, zachowując kontrolę nad treścią.

## 3. Wymagania funkcjonalne

- uwierzytelnianie email/hasło oraz reset hasła jednorazowymi linkami (Supabase Auth)
- formularz do wklejania tekstu i generowania listy kandydatów fiszek AI
- ręczne tworzenie pojedynczej fiszki (front/back)
- lista kandydatów do recenzji z masowym akceptowaniem/edytowaniem/odrzucaniem
- trwałe przechowywanie zaakceptowanych fiszek w bazie
- widok CRUD (przeglądanie, wyszukiwanie, edycja, usuwanie) zapisanych fiszek
- logi zdarzeń (tworzenie, edycja, źródło AI/manualne, sesje, timestampy)
- integracja z gotowym algorytmem powtórek (zewnętrzny pakiet)

## 4. Granice produktu

### W zakresie MVP

- bezpieczne logowanie, rejestracja, reset hasła
- AI generowanie jednej fiszki z wklejanego tekstu
- ręczna edycja i tworzenie fiszek
- prosty interfejs CRUD fiszek
- wyszukiwarka tekstowa front/back
- logowanie zdarzeń
- widok sesji i nauki z algorytmem powtórek

### Poza zakresem MVP

- własne algorytmy powtórek (Anki, SuperMemo)
- import formatów plików (PDF, DOCX)
- współdzielenie zestawów między użytkownikami
- integracje z zewnętrznymi platformami
- aplikacje mobilne

## 5. Historyjki użytkowników

- ID: US-001  
  Tytuł: Rejestracja, logowanie i bezpieczeństwo
  Opis: Nowy użytkownik rejestruje konto przy użyciu adresu email i hasła, potwierdza adres email i loguje się do aplikacji. Nikt inny nie ma dostępu do interfejsu użytkownika.
  Kryteria akceptacji:

  - Użytkownik może zarejestrować się przy użyciu prawidłowego adresu email i silnego hasła.
  - Otrzymuje link do potwierdzenia email lub resetu hasła.
  - Po zalogowaniu użytkownik przechodzi do widoku generowania fiszek
  - Tylko zalogowany użytkownik moze wyświetlać, edytować i usuwać swoje fiszki
  - Nie ma dostępu do fiszek innych użytkowników ani mozliwości wspóldzielenia

- ID: US-002  
  Tytuł: Reset hasła  
  Opis: Użytkownik, który zapomniał hasła, prosi o przesłanie jednorazowego linku resetującego i ustala nowe hasło.  
  Kryteria akceptacji:

  - Użytkownik wprowadza adres email i otrzymuje link resetujący.
  - Link pozwala ustawić nowe hasło.
  - Po zmianie hasła użytkownik może się zalogować.

- ID: US-003  
  Tytuł: Ręczne tworzenie fiszki  
  Opis: Zalogowany użytkownik tworzy nową fiszkę, podając front (≤200 znaków) i back (≤500 znaków).  
  Kryteria akceptacji:

  - Formularz waliduje długość frontu i tylnej strony.
  - Nowa fiszka zapisywana jest w bazie z source=manual.
  - Użytkownik widzi ją w swojej liście na widoku "Moje fiszki".

- ID: US-004  
  Tytuł: Generowanie fiszki AI  
  Opis: Zalogowany użytkownik wkleja tekst w polu tekstowym, klika "Generuj" i otrzymuje kilka propozycji fiszek AI.
  Kryteria akceptacji:

  - Pole tekstowe oczekuje od 1000 do 10 000 znaków.
  - Tekst przekazywany jest do API modelu LLM.
  - Pojawia się kilka fiszek z front/back.
  - Użytkownik może zaakceptować, edytować lub odrzucić propozycje.

- ID: US-005  
  Tytuł: Masowa recenzja kandydatów  
  Opis: Zalogowany użytkownik widzi listę wygenerowanych fiszek AI i może zaznaczać wiele pozycji, aby wykonać masowe operacje (akceptuj, edytuj, odrzuć).  
  Kryteria akceptacji:

  - Lista pokazuje front, back i timestamp generacji.
  - Użytkownik może zaznaczyć wiele pozycji i wykonać masowe operacje.
  - Zaakceptowane trafiają do bazy CRUD, odrzucone są usuwane, edytowane wracają do listy.

- ID: US-006  
  Tytuł: Przeglądanie i wyszukiwanie fiszek  
  Opis: Użytkownik przegląda zapisane fiszki i filtruje je według tekstu front/back.
  Kryteria akceptacji:

  - Użytkownik wpisuje fragment tekstu i widzi tylko pasujące fiszki.

- ID: US-007  
  Tytuł: Edycja i usuwanie fiszek  
  Opis: Użytkownik edytuje front/back istniejącej fiszki lub usuwa ją z bazy.  
  Kryteria akceptacji:

  - Edycja aktualizuje front/back i timestamp updated_at.
  - Usunięcie usuwa wpis z bazy i loguje akcję.

- ID: US-008  
  Tytuł: Bezpieczny dostęp  
  Opis: Tylko uwierzytelnieni użytkownicy mają dostęp do interfejsu i API.  
  Kryteria akceptacji:

  - Wszystkie endpointy wymagają ważnego tokenu sesji.
  - Nieautoryzowani użytkownicy otrzymują HTTP 401.

- ID: US-009  
  Tytuł: Wygląd i wyświetlanie
  Opis: Lista wygenerowanych fiszek AI i manualnie wyświetla się pod formularzem generowania. Lista zaakceptowanych fiszek trafia do widoku "Moje fiszki"

- ID: US-010  
  Tytuł: Widok sesji i nauki z algorytmem powtórek
  Opis: Jako zalogowany użytkownik chcę, aby dodane fiszki były odstępne w widoku "Sesja nauki" opartym na zewnętrznym algorytmie, aby móc efetkywnie się uczyć (spaced repetition).
  Kryteria akceptacji:
  - W widoku "Sesja nauki" algorytm przygotowuje dla mnie sesje nauki fiszek
  - Na start wyświetlany jest przód fiszki, poprzez interakcję użytkownik wyświetla jej tył
  - Użytkownik ocenia zgodnie z oczekiwaniami algrytmu na ile przyswoił fiszkę
  - Następnie algorytm pokazuje kolejną fiszkę w ramach sesji nauki

## 6. Metryki sukcesu

- 75% fiszek wygenerowanych przez AI zaakceptowanych przez użytkowników (monitorowane w logach).
- 75% wszystkich utworzonych fiszek pochodzi z AI generowania.
- Analiza i logowanie liczby generacji vs. liczby akceptacji vs. liczby tworzeń manualnych.
