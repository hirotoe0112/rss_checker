import Parser from 'rss-parser';
import * as AWS from 'aws-sdk';
//let parser = new Parser();
let sns = new AWS.SNS();

const TOPIC_ARN=process.env.TOPIC_ARN || "";

type CustomItem = {
    description: string
};
type Article = {
    title: string,
    url: string,
    date: string,
}

const parser: Parser<CustomItem> = new Parser({
    customFields: {
        item: ['description']
    }
});

export const handler = async (event: any,): Promise<any> => {
    //日本時間の24時間前の日時を取得
    let lastchkdate = new Date();
    lastchkdate.setHours(lastchkdate.getHours() - 24);
    const date = FormatDate(lastchkdate);
    
    //対象のURL一覧
    let targetUrl = [
        'https://rss.itmedia.co.jp/rss/2.0/ait.xml',
        'https://aws.amazon.com/jp/blogs/news/feed/',
        'https://news.microsoft.com/ja-jp/category/blog/feed/',
        'https://zenn.dev/feed',
        ]

    let mailbody = "";
    for(let i = 0; i < targetUrl.length; i++){
        //RSSファイルを解析
        const feed = await parser.parseURL(targetUrl[i]);
        let title = ""
        if(typeof(feed.title) === 'string'){
            title = feed.title
        }

        //24時間以内に公開された記事のみを取得
        let targets: Article[] = [];
        feed.items.forEach(item => {
            let dispTitle = ""
            let dispUrl = ""
            let pubdate = "";
            if(typeof(item.pubDate) === 'string'){
                pubdate = FormatDate(new Date(item.pubDate));
            }
            if(typeof(item.title) === 'string'){
                dispTitle = item.title
            }
            if(typeof(item.link) === 'string'){
                dispUrl = item.link
            }
            if(date <= pubdate){
                var target: Article = {
                    title:dispTitle,
                    url:dispUrl,
                    date:pubdate
                };
                targets.push(target);
            }
        });
        //メール本文に掲載するために記事一覧をフォーマットする
        mailbody += FormatArticles(title, targets);
    }
    //ここからメール送信
    let params = {
        TopicArn: TOPIC_ARN,
        Subject: '!!new!!【自動配信】本日の更新記事',
        Message: mailbody
    };
    await sns.publish(params).promise();
};

function FormatDate(date: Date): string{
    let origin = new Date(date);
    //Lambdaだと9時間ずれるため修正
    origin.setHours(origin.getHours() + 9);
    //年
    const year = origin.getFullYear().toString();
    //月
    let month = (origin.getMonth() + 1).toString();
    month = month.toString().padStart(2, '0');
    //日
    let day = (origin.getDate()).toString();
    day = day.toString().padStart(2, "0");
    //時間
    let hour = (origin.getHours()).toString();
    hour = hour.toString().padStart(2, "0");
    //分
    let min = (origin .getMinutes()).toString();
    min = min.toString().padStart(2, "0");
    //秒
    let sec = (origin .getSeconds()).toString();
    sec = sec.toString().padStart(2, "0");
    return (year + '/' + month + '/' + day + ' ' + hour + ':' + min + ':' + sec);
}

function FormatArticles(
    title: string,
    articles: Article[],
    ): string{
    let result = "";
    result += '+-----------------------------------------------------------+' + '\r\n';
    result += "■" + title + '\r\n';
    result += '+-----------------------------------------------------------+' + '\r\n';
    if(articles.length == 0){
        result += "24時間以内に更新された記事はありません。\r\n\r\n";
    }else{
        articles.forEach(article => {
            result += article.date + '\r\n';
            result += article.title + '\r\n';
            result += article.url + '\r\n\r\n';
        });
    }
    return result;
}