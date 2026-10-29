/**
 * Script de Sincronização de Notícias
 * 
 * Obtém as últimas notícias publicadas na página de notícias da Secretaria
 * (embutida no Google Sites via educacao-tech.github.io/noticias_2025),
 * mescla com as notícias locais existentes (preservando novidades locais)
 * e ordena rigorosamente da mais recente para a mais antiga pela data da notícia.
 * 
 * Uso:
 *   node sync-news.js           (sincroniza e ordena as notícias)
 *   node sync-news.js 10        (limita às 10 mais recentes)
 *   node sync-news.js all       (mantém todas as notícias publicadas)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const REMOTE_URL = 'https://educacao-tech.github.io/noticias_2025/news.json';
const OUTPUT_FILE = path.join(__dirname, 'news.json');

// Quantidade padrão de notícias a manter (null = mantém todas as mescladas ordenadas)
const DEFAULT_LIMIT = null;

// Extrai timestamp numérico da notícia para ordenação precisa
function getTimeFromItem(item) {
    if (!item) return 0;
    if (item.date) {
        const isoMatch = String(item.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])).getTime();
        }
        const timestamp = Date.parse(item.date);
        if (!isNaN(timestamp)) return timestamp;
    }
    if (item.displayDate) {
        const brMatch = String(item.displayDate).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (brMatch) {
            return new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1])).getTime();
        }
        const meses = {
            janeiro: 0, fevereiro: 1, marco: 2, março: 2, abril: 3, maio: 4, junho: 5,
            julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
        };
        const textMatch = String(item.displayDate).toLowerCase().match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/);
        if (textMatch && meses[textMatch[2]] !== undefined) {
            return new Date(Number(textMatch[3]), meses[textMatch[2]], Number(textMatch[1])).getTime();
        }
    }
    return 0;
}

function fetchNews(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MeuCarrossel/1.0'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const redirectUrl = new URL(res.headers.location, url).href;
                return resolve(fetchNews(redirectUrl));
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`Falha HTTP ao consultar fonte: Status ${res.statusCode}`));
            }

            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (err) {
                    reject(new Error(`Erro ao analisar JSON retornado: ${err.message}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    console.log(`[1/4] Conectando à fonte de notícias: ${REMOTE_URL}`);
    
    let remoteNews = [];
    try {
        remoteNews = await fetchNews(REMOTE_URL);
    } catch (err) {
        console.warn(`⚠️ Não foi possível baixar da fonte remota: ${err.message}`);
    }

    // Carrega notícias locais existentes para não perder notícias adicionadas manualmente
    let localNews = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            localNews = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        } catch (err) {
            console.warn(`⚠️ Erro ao ler news.json local: ${err.message}`);
        }
    }

    console.log(`[2/4] Notícias locais: ${localNews.length} | Notícias remotas: ${remoteNews.length}`);

    // Mescla ambas as fontes evitando duplicatas por link ou título
    const newsMap = new Map();

    // 1º Insere locais
    localNews.forEach(item => {
        if (item && item.published) {
            const key = item.link || item.title;
            newsMap.set(key, item);
        }
    });

    // 2º Insere remotas
    remoteNews.forEach(item => {
        if (item && item.published) {
            const key = item.link || item.title;
            if (!newsMap.has(key)) {
                newsMap.set(key, item);
            }
        }
    });

    // Ordenação ESTRITA por data decrescente (mais recente primeiro)
    const sortedNews = Array.from(newsMap.values())
        .sort((a, b) => getTimeFromItem(b) - getTimeFromItem(a));

    console.log(`[3/4] Total de notícias consolidadas: ${sortedNews.length}`);

    // Define limite opcional passado por parâmetro
    const argLimit = process.argv[2];
    let limit = DEFAULT_LIMIT;
    if (argLimit && argLimit.toLowerCase() !== 'all') {
        const parsed = parseInt(argLimit, 10);
        if (!isNaN(parsed) && parsed > 0) {
            limit = parsed;
        }
    }

    const finalNews = limit ? sortedNews.slice(0, limit) : sortedNews;

    console.log(`[4/4] Salvando ${finalNews.length} notícias ordenadas em ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalNews, null, 4), 'utf8');

    console.log('\n✅ Notícias ordenadas por data com sucesso!');
    console.log('--------------------------------------------------');
    finalNews.forEach((item, index) => {
        console.log(`${index + 1}. [${item.date || item.displayDate || 'Sem data'}] ${item.title}`);
    });
    console.log('--------------------------------------------------');
}

main();
