-- Enforce the category allow-list at the database level.
-- Adds CHECK constraints on articles.category and alert_rules.categories
-- so rows with unknown categories cannot be inserted or updated.

-- Defensive cleanup: any existing rows outside the allow-list are
-- reset to 'vulnerability' (the safest generic bucket) so the CHECK
-- does not reject the migration itself.
update articles
set category = 'vulnerability',
    updated_at = now()
where category not in (
  'vulnerability', 'malware', 'ransomware', 'data-breach', 'apt',
  'zero-day', 'supply-chain', 'phishing', 'insider-threat', 'ddos', 'ai'
);

alter table articles
  drop constraint if exists articles_category_check;

alter table articles
  add constraint articles_category_check
  check (category in (
    'vulnerability', 'malware', 'ransomware', 'data-breach', 'apt',
    'zero-day', 'supply-chain', 'phishing', 'insider-threat', 'ddos', 'ai'
  ));

-- alert_rules.categories is a text[]. Require every element to be in
-- the same allow-list (an empty array is valid and means "any").
update alert_rules
set categories = array(
  select c from unnest(categories) c
  where c in (
    'vulnerability', 'malware', 'ransomware', 'data-breach', 'apt',
    'zero-day', 'supply-chain', 'phishing', 'insider-threat', 'ddos', 'ai'
  )
)
where categories is not null
  and not (categories <@ array[
    'vulnerability', 'malware', 'ransomware', 'data-breach', 'apt',
    'zero-day', 'supply-chain', 'phishing', 'insider-threat', 'ddos', 'ai'
  ]::text[]);

alter table alert_rules
  drop constraint if exists alert_rules_categories_check;

alter table alert_rules
  add constraint alert_rules_categories_check
  check (
    categories is null
    or categories <@ array[
      'vulnerability', 'malware', 'ransomware', 'data-breach', 'apt',
      'zero-day', 'supply-chain', 'phishing', 'insider-threat', 'ddos', 'ai'
    ]::text[]
  );
