# OSEILLE V5 — audit, corrections et dossier de décision

22 novembre 2026. Le code proposé n'est pas déployé. Aucun nouveau message commercial, jeton pilote, paiement ou abonnement n'a été créé. Les tests signés de lecture ont ajouté des événements internes D1 conformément à l'audit autorisé. L'état commercial reste sans client indépendant attribué ni recette démontrée.

## A — Audit technique et causes

Les quatre Workers actifs ont été téléchargés via Cloudflare, ainsi que leurs réglages/bindings et le staging Radar. Le dernier cron complet du 22 novembre à 06:00:20.655 UTC valide quatre agents, avec vérifications signées. Un contrôle Internet indépendant de notre runtime, exécuté le 22 novembre à 08:27:28 UTC, passe 20/20 vérifications dont quatre appels métier réels et quatre erreurs intentionnelles. Les 16 requêtes signées ont chacune une ligne D1 `verified_internal_test`, avec la version active correcte. Ce sont des observations ponctuelles de l'éditeur, pas une disponibilité continue ni un test indépendant de l'entreprise.

Versions actives : Guardian `584443aa-b55a-4213-953b-38ebfc5ab815`, Repair `931d11df-f092-46d0-a4d8-f32a1f2f2956`, Signals `4096dce7-8e7d-4bf5-9cf3-9273d52ec206`, Radar `2f02856c-400b-49a8-bb89-4a6a03cbab68`. Radar staging reste `419f3c65-c004-4511-a5a7-32d86411ccbb`. Ces versions servent de points de retour arrière après un éventuel futur déploiement approuvé.

Risque confirmé : le `main` privé est au commit du 17 novembre `ffe634f…`, antérieur aux corrections actives. Une livraison basée aveuglément sur main pourrait perdre instrumentation, quotas atomiques et timeout Signals de 10 s. La branche proposée réintègre les sources réellement actives et conserve leurs modules de télémétrie avant d'ajouter V5. Revue du diff et validation staging obligatoires avant fusion/déploiement.

L'erreur interne `release_gate` signalée après le 21 novembre est le test négatif signé de notre audit : corrélation `efc681de-14e8-43b5-a2cc-3976f6d0d2c6`. Elle ne démontre pas un incident. Les `unknown_tool` anonymes ne permettent pas de distinguer une exploration d'un client mal configuré. Les résultats Signals vides sont possibles et ne prouvent pas une panne métier. Sa latence reste un risque amont réel ; aucune accélération n'est revendiquée.

Les cinq derniers runs GitHub Actions planifiés sont terminés en succès (17–21 novembre), dont `44914946544` le 21 novembre. Aucun run du 22 n'était encore visible lors de l'extraction vers 08:25 UTC. Cela ne vaut pas une garantie continue. Logs persistants/quotas de compte non certifiés ; les lectures D1 et versions sont les preuves principales.

## B — Corrections et validation

| Agent | Défaut ou manque démontré | Correction additive et critère d'acceptation |
|---|---|---|
| Guardian | Restriction d'enum classée seulement changement à revoir ; changement d'outputSchema absent du diff | Détecter `narrowed_enum`, fermeture des arguments supplémentaires et changement de contrat de sortie ; CI BLOCK pour incompatibilités détectées, REVIEW sinon, PASS_SUBSET_ONLY avec limites |
| Repair | Conseils textuels sans plan structuré de preuve/validation/rollback | `repair_plan` expose signaux, étapes, suggestion de changement non appliquée, risques et rollback ; aucune donnée d'erreur brute dans ce plan |
| Signals | Date limite invalide convertie en `deadline_passed=false`, ambiguë avec une candidature encore ouverte | Date invalide -> null/unknown, liens source par enregistrement, couverture et lignes malformées explicites, statut métier distinct d'HTTP |
| Radar | Décision textuelle sans signal stable directement utilisable par un pipeline | Bloc `ci` avec décision, code de sortie, périmètre et interdiction explicite d'autodéploiement ; couverture incomplète bloque, avis connu demande revue |
| Les quatre | Erreur d'outil surtout textuelle | `structuredContent.error` contient catégorie, possibilité de réessai et action ; erreurs JSON-RPC de protocole préservées |

33 tests locaux passent : 20 contrôles préexistants de compteur/services et 13 tests V5. Les 13 nouveaux tests exécutés sur les sources de production avant modification donnent 2 succès et 11 échecs attendus ; après correction 13/13 passent. La migration SQL existante reste idempotente en mémoire. Les champs/règles publics existants et les quatre noms sont conservés.

Limites : tests sous Node 24 avec D1/HTTP simulés et appels réels sur la version de production inchangée. Les nouveaux résultats n'ont pas encore été validés sur le runtime Workers staging. Aucune amélioration de performance ou d'adoption après déploiement n'est donc établie. Pas de retry automatique ajouté à BOAMP sans budget amont mesuré : timeout 10 s conservé, échec explicite et réessai contrôlé par le client. Le CI ne doit jamais traiter un sous-ensemble statique ou une absence d'avis OSV comme autorisation de livrer.

## C — Qualité et performances

Notes de revue internes, non avis clients : cinq axes notés chacun sur 2 (utilité, interprétation des résultats, erreurs, intégration, preuves). Scores agrégés avant -> proposition locale : Guardian 6 -> 7, Repair 5 -> 7, Signals 5 -> 6, Radar 6 -> 7 sur 10. Les gains concernent uniquement les comportements testés ; ils n'évaluent ni satisfaction ni demande. Pour atteindre 8+, il manque des cas indépendants, compatibilité multi-clients et résultats comparés à des décisions réelles.

Latences D1 de succès métier, fenêtre glissante sept jours à l'extraction vers 08:24 UTC, percentile nearest-rank :

| Service | n | p50 ms | p95 ms | p99 ms |
|---|---:|---:|---:|---:|
| agent-guardian | 27 | 280 | 418 | 585 |
| agent-repair | 28 | 284 | 423 | 632 |
| agent-signals | 33 | 1382 | 7855 | 7960 |
| agent-dependency-radar | 33 | 1168 | 1674 | 2371 |

Échantillons petits, comprenant surtout les tests de l'éditeur. p99 proche du maximum observé, non estimation stable d'un SLA. Mesure côté Worker et télémétrie, différente du temps HTTP client. Le comparatif avant/après est fonctionnel (tests) ; le comparatif de latence après V5 est non commencé tant que le staging n'a pas validé la proposition.

## D — Distribution, installation et conversion

Les quatre fiches Glama existent, propriété vérifiée et transport Streamable HTTP annoncés. Leurs tests affichés datent du 17 novembre pour Guardian/Repair/Signals et du 20 pour Radar ; leurs notes de novembre 15/18 ne mesurent pas V5. Radar reste décrit comme proche d'un autre outil, ce que la correction du 21 a tenté de clarifier. Aucune fiche externe n'a été éditée.

AgentSearch : les quatre GET documentés `/api/agent/{name}` retournent 404 aujourd'hui. Cela signifie fiche non retrouvée à ces adresses, pas absence certaine de toute indexation. Aucune ressoumission. Les issues Cline #3963 et Awesome #16 restent ouvertes avec zéro commentaire. Aucun nouveau candidat `[Pilot request]` ni retour `[Pilot feedback]` dans le dépôt public. Aucun client ou testeur n'est inventé.

Le guide `INTEGRATION.md` prépare quatre descriptions différenciées, exemples exécutables existants, configuration courte, consignes de CI et dossier marketplaces. Le hub actuel /pilot reste disponible sans compte. Le runtime Python urllib a reçu 403 sur le hub, mais Node fetch récupère /health, /metrics et /adoption.json en HTTP 200 ; une erreur du client de surveillance n'est donc pas une panne du service. Les anciennes synthèses doivent conserver cette distinction.

Étapes mesurables : découverte (présence des fiches), consultation (requêtes agrégées), installation (test réel dans chaque client), premier résultat (appel métier réussi), seconde décision (retour volontaire un autre jour), récurrence (cohortes matures) et premium (preuve écrite puis paiement autorisé). Aucun taux individuel n'est déduit des initialisations anonymes. L'enrôlement reste optionnel et nécessite consentement, indépendance, canal privé et autorisation de création du jeton.

## E — Adoption et tableau de bord

Sur la fenêtre fixe 21 novembre 08:20 -> 22 novembre 08:20 UTC : 24 tools/call réussis, 21 tests identifiés et trois démonstrations Guardian inconnues. Ce ne sont pas trois clients. Les deux tables de credentials de production sont vides. Seul Radar active OSEILLE_PILOT_ENABLED=1 et OSEILLE_DISCOVERY_LOGGING=1 ; les trois autres conservent découverte 0 et pilote absent.

Le hub /metrics expose 281 appels V4 sur sept jours à 08:30:17.600 UTC, zéro vérifié extérieur. /adoption.json à 08:30:17.649 UTC confirme zéro équipe Radar active D7/D30, zéro seconde journée, rétention null faute de cohorte et zéro analyse inconnue réussie. Ces fenêtres ne sont pas additionnées à la fenêtre fixe D1. Le tableau `dashboard.html` est un instantané avec sources, limites et valeurs non déterminées ; coûts/marges non mesurés restent null et non zéro.

## F — x402, coûts et seuils

`x402_premium_charges` de staging existe mais ne contient aucune ligne, tous états confondus. La table ne compte pas les défis non payés. Le code staging contient lien paiement/analyse, cache chiffré du résultat, reprise après réponse perdue, refus du mauvais réseau et contrôle des logs USDC/nonce/transaction. Trois tests existants passent avec facilitateur et RPC simulés ; cela ne prouve ni signature cryptographique réellement acceptée par un tiers ni règlement on-chain. E2E Base Sepolia reste BLOQUÉ — DÉPENDANCE EXTERNE : route staging privée, accès de test à convenir et autorisation d'utilisation d'un portefeuille de test. Aucun transfert n'a été signé dans cette mission. L'adresse bénéficiaire configurée ne démontre pas sa propriété.

Le facilitateur actif du code est PayAI, pas Coinbase. Avoir un compte Coinbase ne configure pas automatiquement CDP. Une migration CDP doit être validée en staging, avec frais/conditions et clés dédiées ; ne pas remplacer le fournisseur sans essai. La documentation officielle CDP annonce 1 000 règlements mensuels gratuits puis 0,001 USD/règlement, vérification gratuite ; ces frais sont un scénario alternatif, pas les coûts facturés de notre facilitateur actuel.

Cloudflare `workers/account-settings` indique standard, ce qui ne prouve pas le plan payant/gratuit. L'API abonnements renvoie 403. Factures, quotas globaux, coûts PayAI, gas, retraits, conversion, GitHub Actions et stockage complet restent non vérifiés. Aucun coût d'exploitation réel égal à zéro n'est déclaré.

Modèle reproductible `economics.mjs`, CSV joint : une analyse = un règlement, hypothèse 1 USDC = 1 USD pour convertir le tarif CDP, sans gas additionnel validé. Net de scénario = encaissé - frais de facilitation - coûts variables - infrastructure/autres coûts saisis. Scénario de sensibilité : variable 0,005 USDC et fixe 20 USDC/mois ; ces montants sont hypothétiques. Fiscalité, remboursements et temps de maintenance non inclus. Les totaux après frais seuls ne sont pas une marge nette réelle.

| Analyses/mois | Prix USDC | Brut | Frais CDP hypothétiques | Après ces frais seuls | Net du scénario variable/fixe |
|---|---:|---:|---:|---:|---:|
| 100 | 0.05 | 5.00 | 0.00 | 5.00 | -15.50 |
| 100 | 0.10 | 10.00 | 0.00 | 10.00 | -10.50 |
| 100 | 0.25 | 25.00 | 0.00 | 25.00 | 4.50 |
| 1000 | 0.05 | 50.00 | 0.00 | 50.00 | 25.00 |
| 1000 | 0.10 | 100.00 | 0.00 | 100.00 | 75.00 |
| 1000 | 0.25 | 250.00 | 0.00 | 250.00 | 225.00 |
| 10000 | 0.05 | 500.00 | 9.00 | 491.00 | 421.00 |
| 10000 | 0.10 | 1000.00 | 9.00 | 991.00 | 921.00 |
| 10000 | 0.25 | 2500.00 | 9.00 | 2491.00 | 2421.00 |
| 100000 | 0.05 | 5000.00 | 99.00 | 4901.00 | 4381.00 |
| 100000 | 0.10 | 10000.00 | 99.00 | 9901.00 | 9381.00 |
| 100000 | 0.25 | 25000.00 | 99.00 | 24901.00 | 24381.00 |

Sous le scénario variable/fixe précédent et un change purement illustratif de 0,92 EUR/USDC (pas une cotation), voici les volumes mensuels pour les objectifs de revenu net opérationnel hors fiscalité et temps de travail :

| Objectif EUR | à 0,05 | à 0,10 | à 0,25 USDC |
|---|---:|---:|---:|
| 100 | 2903 | 1359 | 526 |
| 300 | 7843 | 3672 | 1415 |
| 500 | 12784 | 5984 | 2306 |
| 1000 | 25136 | 11766 | 4533 |
| 1500 | 37488 | 17548 | 6760 |

Ces volumes ne sont pas des prévisions et peuvent dépasser la capacité actuelle : 120 vérifications non mises en cache/jour, soit au plus 15 analyses premium de huit paquets ou 30 de quatre paquets/jour si tout est non mis en cache, avant les autres appels. À 30 jours cela représente environ 450–900 analyses, sans disponibilité garantie. Les scénarios 10 000/100 000 exigent une étude de capacité et de coûts. Quarante heures mensuelles valorisées à 20 EUR/h représenteraient 800 EUR supplémentaires, non couvertes par un objectif de 100–300 EUR seul.

Prix à tester après preuve de valeur : 0,05 pour vérifier l'acceptation du parcours, 0,10 pour une analyse avancée justifiée, 0,25 pour un rapport de décision plus utile ; aucune validation marché. Tarifs par complexité à mesurer par nombre de sources/paquets et durée. Packs prépayés réduiraient les règlements mais nécessitent ledger, remboursement et protection anti-rejeu. Abonnement/quota nécessite identité, facturation et gestion des droits : NON COMMENCÉ, ne pas ajouter avant demande. Le prix seul ne différencie pas les produits.

Avant commercialisation française : choisir le statut, faire valider facturation, TVA/territorialité, conversion/comptabilité des encaissements et obligations de données par un professionnel. Un hash x402 ne remplace pas une facture. Les guides officiels ci-dessous détaillent facturation et e-reporting mais ne constituent pas une validation juridique personnalisée.

## G — Feuille de route et décision

| Horizon | Travail | Impact / effort / coût / risque | Critère |
|---|---|---|---|
| 7 jours | Revue PR, synchronisation source, staging des quatre agents et tableau avant/après | Fort / 1–2 jours / ressources existantes, facture à vérifier / modéré | 33 tests, traces signées et exemples clients passent sans perte de télémétrie |
| 7 jours | Installation Cline réelle, logo PNG, vérification des canaux | Fort / 0,5 jour / aucun achat autorisé / faible tant que non publié | preuve d'installation, dossier complet prêt à approuver |
| 14 jours après premier essai | Trois équipes indépendantes, deux secondes décisions, une intention écrite | Fort / suivi borné / sans trafic acheté / dépendance utilisateurs | retours et appels attribués consentis, aucune fixture comptée |
| 14 jours | Testnet E2E autorisé, facilitateur choisi, hash et résultat rapprochés | Fort / 1 jour / testnet et frais à confirmer / financier en staging | un règlement confirmé et rejeu sans deuxième facturation |
| 30 jours | Mesurer usage utile, dépenses et support ; décider premium ou recentrage | Fort / suivi 10–15 h/semaine max / plafonds approuvés / modéré | décision fondée sur rétention, coût variable et volonté de payer |

## H — État des livrables

TERMINÉ ET TESTÉ : inspection active, 20 contrôles publics, 16 traces D1, 33 tests de code, trois tests de paiement simulés, un test du modèle économique, guides et instantané de pilotage. IMPLÉMENTÉ MAIS NON VALIDÉ : changements produit des quatre agents dans le runtime staging. PRÉPARÉ — APPROBATION REQUISE : déploiement production, publication des fiches, nouveau contact externe, délivrance de jeton, essai du portefeuille et activation commerciale. BLOQUÉ — DÉPENDANCE EXTERNE : factures/quotas sans permission de lecture, vrais candidats et retours, session communautaire, preuve on-chain. NON COMMENCÉ : abonnement, packs prépayés, audit transitive complet et futur changement de prix en production. La mission commerciale n'est pas déclarée achevée.

Sources publiques consultées le 22 novembre :
- https://docs.cdp.coinbase.com/x402/seller/facilitator
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://entreprendre.service-public.gouv.fr/vosdroits/F31808
- https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/fiches_reforme/fiche-e-reporting_paiements.pdf
- Quatre fiches Glama io.github.neat-cyber, tests affichés datés et non assimilés à un SLA.

## Pull request et validation GitHub

Le code est proposé dans [agent-guardian PR #3](https://github.com/neat-cyber/agent-guardian/pull/3), branche `oseille-v5/quality-and-ci`, commit `b99b48c692114bfb75f88b9dcdfcd6f7a51eda71`. La validation GitHub Actions [45003451628](https://github.com/neat-cyber/agent-guardian/actions/runs/45003451628) a terminé en succès le 22 novembre à 08:34:45 UTC, sur ce commit, avec le workflow sans déploiement. La PR reste draft, non fusionnée.

Pour la prochaine validation runtime, les Workers staging restent privés. L'ancien relais d'audit authentifié est fermé. Son ouverture temporaire pendant 30 minutes, limitée aux endpoints staging déjà autorisés et suivie d'une fermeture, constitue une modification d'un Worker de production : elle nécessite l'accord explicite prévu par V5. Aucune activation n'a été effectuée. Il faut aussi confirmer le portefeuille de test et ses fonds fictifs avant tout test on-chain ; les tests de paiement simulés ne suffisent pas.
