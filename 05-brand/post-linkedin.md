Dans les coulisses de Jàng : un seul réglage dans Dify, et tout change.

Nous construisons la base de connaissances de Jàng, notre correcteur d'exercices du Bac sur WhatsApp. Première question : quelle taille de chunk ?

- **500** : Dify coupe chaque exercice en 3 morceaux.
- **1000** : 10 exercices sur 14 sont encore coupés en deux. L'identifiant se retrouve séparé de son corrigé de référence. Les symboles ×, √, τ, Ω coûtent beaucoup de tokens.
- **2000** : chaque exercice tient en un seul morceau (312 à 485 tokens).

La leçon : pour un correcteur, un exercice = un chunk. Sinon, le corrigé peut être rattaché au mauvais exercice.

Nos corrigés de référence sont en cours de validation par des professeurs.

#Dify #EdTech #Bac

On apprend de ses erreurs.
