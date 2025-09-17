import React from 'react';
import '../css/AdvertisementAppSite.css';
import fetch from 'node-fetch';
import {} from "@vkontakte/icons";
import {openUrl, decOfNum, shortIntegers, get, getRandomInts, appendScript} from "../js/utils";
import {Icon24Chevron} from "@vkontakte/icons";
import {Icon16Link, Icon28HomeOutline} from "@vkontakte/icons";
import {ReactComponent as Icon16Heart} from "../assets/advertisement_site/heart.svg";
import {ReactComponent as Icon16HeartFilled} from "../assets/advertisement_site/heart_filled.svg";

const
    apiUrl = 'https://api.ad-app.ru/method/',
    defaultParams = {
        vk_access_token_settings: '',
        vk_app_id: 8082057,
        vk_are_notifications_enabled: 0,
        vk_is_app_user: 0,
        vk_is_favorite: 0,
        vk_language: 'ru',
        vk_platform: 'desktop_web',
        vk_ref: 'other',
        vk_ts: 1645128590,
        vk_user_id: 246549084,
        sign: 'WWw4zJixtI52rEZm6dq4nktpzNQ_wS-HNkyworOXCYI'
    }
;

class AdvertisementAppSite extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            currentArticleSliceIndex: 0,
            articles: [],
            articles_liked: []
        };

        this.componentDidMount = this.componentDidMount.bind(this);

        const
            resize = () => {
                const
                    windowHeight = document.documentElement.clientHeight,
                    windowWidth = document.documentElement.clientWidth,
                    isTabled = windowWidth >= windowHeight
                ;
                this.setState({isTabled});
            },
            getHash = () => window.location.hash.replaceAll('#', '')
        ;

        window.onload = () => {
            resize();
        };
        window.onresize = () => {
            resize();
        };
        window.onhashchange = async () => {
            console.log('onhashchange');
            const
                hash = getHash(),
                article = this.state.articles.find(value => value.id == hash.replaceAll('article', ''))
            ;
            if (article) {
                await this.setState({article_info: (await this.getStickers(article.id))});
                setTimeout(() => {
                    appendScript(this.loadAdvertArticlePage);
                }, 400);
            } else {
                await this.setState({article_info: undefined});
                setTimeout(() => {
                    appendScript(this.loadAdvertMainPage);
                }, 400);
            }
        };
        this.loadAdvertArticlePage = `
            (function(w, d, n, s, t) {
            w[n] = w[n] || [];
            w[n].push(function() {
            Ya.Context.AdvManager.render({
            blockId: "R-A-1311671-30",
            renderTo: "yandex_rtb_R-A-1311671-30",
            async: true
            });
            });
            t = d.getElementsByTagName("script")[0];
            s = d.createElement("script");
            s.type = "text/javascript";
            s.src = "//an.yandex.ru/system/context.js";
            s.async = true;
            t.parentNode.insertBefore(s, t);
            })(this, this.document, "yandexContextAsyncCallbacks");
        `;

        this.loadAdvertMainPage = `
            (function(w, d, n, s, t) {
            w[n] = w[n] || [];
            w[n].push(function() {
            Ya.Context.AdvManager.render({
            blockId: "R-A-1311671-31",
            renderTo: "yandex_rtb_R-A-1311671-31",
            async: true
            });
            });
            t = d.getElementsByTagName("script")[0];
            s = d.createElement("script");
            s.type = "text/javascript";
            s.src = "//an.yandex.ru/system/context.js";
            s.async = true;
            t.parentNode.insertBefore(s, t);
            })(this, this.document, "yandexContextAsyncCallbacks");
        `;
    }

    async componentDidMount() {
        await this.updateArticles();
        window.onhashchange();
    }

    async updateArticles() {
        await this.setState({
            articles: (await get(apiUrl + 'stickers.get', defaultParams)).response,
            article_info: undefined
        });
        return true;
    }

    async getStickers(id) {
        return (await get(apiUrl + 'stickers.getById', {...defaultParams, id})).response;
    }

    async likeArticle(id, like) {
        await get(apiUrl + 'stickers.like', {...defaultParams, id, like});
        const {article_info} = this.state;
        await this.setState({article_info: Object.assign(article_info, {likes: article_info.likes + (like ? 1 : -1)})});
    }

    render() {
        const
            {
                isTabled, articles, currentArticleSliceIndex,
                articles_liked,

                article_info,

                popout
            } = this.state,

            isArticle = article_info !== undefined,
            {id, image, title, date, likes, views, description, url, stickers} = isArticle ? article_info : {},
            article_liked = isArticle && articles_liked.indexOf(id) > -1
        ;

        return (
            <React.Fragment>
                {
                    isArticle ?
                        <div className={`Article__Container Container__${isTabled ? 'tabled' : 'phone'}`}>
                            <div className='Button__Main' onClick={() => {
                                window.location.hash = '';
                                this.updateArticles();
                            }}>
                                <Icon28HomeOutline width={16} height={16} fill='#3687FF'/>
                                <span style={{marginLeft: 10}}>
                            На главную
                        </span>
                            </div>
                            <div className='Article__Info'>
                                <div className='Article__Icon'>
                                    <img alt='article_icon' src={image}/>
                                </div>
                                <div className='Article__Titles'>
                                    <span>{title}</span>
                                    <br/>
                                    <span>{new Date(date).toLocaleString('ru', {
                                        day: 'numeric',
                                        month: 'numeric',
                                        year: 'numeric'
                                    })} · {shortIntegers(views)} {decOfNum(views, ['просмотр', 'просмотра', 'просмотров'], false)}</span>
                                </div>
                                <div className='Article__Actions'>
                                    <div onClick={() => openUrl(url)}>
                                        <Icon16Link/>
                                    </div>
                                    <div style={article_liked ? {
                                        color: '#FF5151',
                                        background: '#FFE3E3'
                                    } : {}} onClick={async () => {
                                        if (article_liked)
                                            articles_liked.splice(articles_liked.indexOf(id), 1);
                                        else
                                            articles_liked.push(id);

                                        await this.likeArticle(id, !article_liked);
                                        this.setState({articles_liked});
                                    }}>
                                        {
                                            article_liked ? <Icon16HeartFilled/> : <Icon16Heart/>
                                        }
                                        <span style={{marginLeft: 10}}>
                                    {likes}
                                </span>
                                    </div>
                                </div>
                            </div>
                            <html dangerouslySetInnerHTML={{__html: description}} className='Article__Description'/>
                            <div className='ArticleAdvert' id="yandex_rtb_R-A-1311671-30"></div>
                            {
                                stickers &&
                                <div className='Article__Stickers'>
                                    <span>Набор содержит {decOfNum(stickers.length, ['стикер', 'стикера', 'стикеров'])}:</span>
                                    <br/>
                                    <div>
                                        {
                                            stickers.map(
                                                (value, index) =>
                                                    <img alt='sticker' key={'Img_' + index}
                                                         src={`https://vk.com/sticker/${value}/128.png`}/>
                                            )
                                        }
                                    </div>
                                </div>
                            }
                            <div className='Article__Rec'>
                                <span>Смотрите так же:</span>
                                <br/>
                                <div>
                                    {
                                        getRandomInts(0, articles.length - 1, 3).map(
                                            (value, index) =>
                                                <div key={'div_' + index}
                                                     onClick={() => window.location.hash = `article${articles[value].id}`}>
                                                    <img alt='Icon' src={articles[value].image}/>
                                                    <span>{articles[value].title}</span>
                                                </div>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                        :
                        <div
                            className={`Main__Container Container__${isTabled ? 'tabled' : 'phone'}`}
                            style={{overflow: popout && 'hidden'}}
                        >
                            {
                                popout
                            }
                            <span className='Title'>
                        Стикеры
                        <div>
                            <div
                                className='Button'
                                onClick={() =>
                                    this.setState({
                                        popout: <div className='Popout' onClick={() => this.setState({popout: null})}>
                                            <div className='Text'>
                                                Данный сайт не является официальным сайтом ВКонтакте, и не несёт
                                                ответственности за актуальность той или иной информации.<br/>
                                                <br/>
                                                Мы собираем информацию о стикерах ВКонтакте, и выкладываем их на сайт.
                                                Своевременно мы проверяем актуальность темы, и принимаем соответствующие
                                                действия.
                                            </div>
                                        </div>
                                    })
                                }
                            >
                                О нас
                            </div>
                            <div
                                className='Button'
                                onClick={() =>
                                    this.setState({
                                        popout: <div className='Popout' onClick={() => this.setState({popout: null})}>
                                            <div className='Text'>
                                                За получением обратной связи Вы можете обратиться в нашу группу
                                                ВКонтакте.
                                            </div>
                                            <div
                                                className='Button' style={{marginTop: 24}}
                                                onClick={() => openUrl('https://vk.me/club193090865')}
                                            >
                                                Написать
                                            </div>
                                        </div>
                                    })
                                }
                            >
                                Контакты
                            </div>
                        </div>
                    </span>
                            <div className='Grid'>
                                {
                                    articles.slice(0, 9 + currentArticleSliceIndex).map((({id, image, title, date, likes, views, description, url}, index) =>
                                            <div className='Card' key={`Card_${index}`} onClick={() =>
                                                window.location.hash = 'article' + id
                                            }>
                                                <img alt='card_background' src={image} className='Card__Background'/>
                                                <img alt='card_icon' src={image} className='Card__Icon'/>
                                                <div className='Card__TextLayout'>
                                                    <span className='Card__Title'>{title}</span>
                                                    <br/>
                                                    <span className='Card__Date'>{new Date(date).toLocaleString('ru', {
                                                        day: 'numeric',
                                                        month: 'numeric',
                                                        year: 'numeric'
                                                    })}</span>
                                                </div>
                                            </div>
                                    ))
                                }
                                <div className='Card' id="yandex_rtb_R-A-1311671-31"></div>
                            </div>
                            {
                                articles.length - currentArticleSliceIndex > 9 &&
                                <div className='Button__ShowMore'
                                     onClick={() => this.setState({currentArticleSliceIndex: currentArticleSliceIndex + 9})}>
                                    <Icon24Chevron style={{transform: 'rotate(90deg)', display: 'block'}}/>
                                </div>
                            }
                        </div>
                }
                <div className='Footer'>
                    © {new Date().getFullYear()} {window.location.host.toUpperCase()}
                </div>
            </React.Fragment>
        );
    }
}

export default AdvertisementAppSite;