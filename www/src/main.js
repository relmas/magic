GAME_SIZE_RATIO = 2;

GAME_UID = 'cfd008'
BASE_CARD_SCORE = 100;

UNDO_TYPE_DRAW = "draw";
UNDO_TYPE_PICKUP = "pickUp";
UNDO_TYPE_SAVE_TO_RESERVE = "saveToReserve";
UNDO_TYPE_TAKE_FROM_RESERVE = "takeFromReserve";

LANGUAGE = 'en'
languages = ['en']
loadingResourceQueue = []
stringDictionary = {}

layoutInfo = {};

oldWidth = 480;
oldHeight = 320;
 
function localizedString(str)
{
    var ret = stringDictionary[str];
    if (ret === null || ret === undefined){
        ret = str;
    };
    return ret;
}

// --------------------------------
//   More Games Button Callback
// --------------------------------
function goToMoreGames()
{
    SETTINGS.moreGamesCallback();
}

window.onload = function()
{
    // create an array of assets to preload
    var assetsToLoader = [ 
        'resources/SplashScreen-landscape.png',
        "resources/main.fnt",
        "resources/roundNumberFont.fnt"
        ];
    
    if (GAME_SIZE_RATIO == 2)
    {
        for (var i = 0; i < assetsToLoader.length; i++) {
            assetsToLoader[i] = assetsToLoader[i].replace(".", "-hd.");
        }
    }

    BannerAd.initialize(SETTINGS.ENABLE_AD);

    var loader = new PIXI.AssetLoader(assetsToLoader);
    loader.onComplete = onAssetsLoaded;

    // begin load
    loader.load();

    function onAssetsLoaded(event)
    {
        Profile.initializeGame();
        var sceneManager = SceneManager.instance;
        sceneManager.create(
                            oldWidth * GAME_SIZE_RATIO, 
                            oldHeight * GAME_SIZE_RATIO, 
                            false, 
                            0);        
        setTimeout(function(){            
            window.scrollTo(0, 1);
            sceneManager.startScaling();
        }, 0);        
        sceneManager.pushScene(createLoadingScene());
        loadSpecificLanguageResources('en'); 
    };        
}

function loadSpecificLanguageResources(lang)
{
    // create an array of assets to preload
    var path = 'resources/'+LANGUAGE+'/';
    var assetsToLoader = [ 
            'resources/BG.png',
            'resources/blackscreen.png',
            "resources/cards.json",
            path+'uiAtlas.json'
        ];

    if (GAME_SIZE_RATIO == 2)
    {
        for (var i = 0; i < assetsToLoader.length; i++) {
            assetsToLoader[i] = assetsToLoader[i].replace(".", "-hd.");
        }
    }

    var loader = new PIXI.AssetLoader(assetsToLoader);
    loader.onComplete = function()
    {
        var dictionaryLoader = new PIXI.JsonLoader(path+'localizable.json');
        dictionaryLoader.addEventListener('loaded',function(event)
        {
            stringDictionary = event.content.json;
            var layoutLoader = new PIXI.JsonLoader('resources/board.json');
            layoutLoader.addEventListener('loaded',function(event)
            {
                layoutInfo = event.content.json;
                TweenMax.delayedCall(1, gameStart, null, null);                                
            });
            layoutLoader.load();
        });
        dictionaryLoader.load();
    };
    loader.load();
}

function gameStart()
{
	
    SceneManager.instance.replaceScene(new SceneBackground());
    SceneManager.instance.pushScene(new SceneTitle());    
}

function createLoadingScene()
{
    var loadingScene = new Scene();
    var sprName = GAME_SIZE_RATIO == 1 ? 'resources/SplashScreen-landscape.png' : 'resources/SplashScreen-landscape-hd.png';
    var bg = new PIXI.Sprite.fromImage(sprName);
    loadingScene.addChild(bg);
    return loadingScene;
}

var RoundSummaryPanel = function(timer, deckSize, roundNumber)
{
	
	BM_API.getAd().addAdvertising300x250(34394, 183342);
	
    PIXI.DisplayObjectContainer.call(this);
    this.initialize = function(timer, deckSize, roundNumber){
        var roundBonusValue = roundNumber * 1000;
        var timerBonusValue = Math.floor((Math.floor(timer)/1000))*100;
        var deckSizeBonusValue = deckSize * 200;
        var totalScore = Profile.score + roundBonusValue + timerBonusValue + deckSizeBonusValue;
        Profile.score = totalScore;

        var panelBG = new PIXI.Sprite.fromFrame('GUI_Blank');        
        this.addChild(panelBG);
        this.bg = panelBG;
        this.originX = panelBG.width/2;
        TweenMax.from(panelBG, 0.5, {alpha:0, ease:Power2.easeOut});

        var panelHeader = new PIXI.Sprite.fromFrame('GUI_RoundCompleted');        
        this.addChild(panelHeader);
        panelHeader.position.x = panelBG.width/2 - panelHeader.width/2;
        panelHeader.position.y = GAME_SIZE_RATIO * 23;
        TweenMax.from(panelHeader, 0.5, {alpha:0, ease:Power2.easeOut});        

        var closeButton = new PIXI.Sprite.fromFrame('GUI_Blank_Button_Close');            
        this.addChild(closeButton);
        this.closeButton = closeButton;
        closeButton.position.x = panelBG.width/2 - closeButton.width/2;
        closeButton.position.y = GAME_SIZE_RATIO * 220;
        TweenMax.from(closeButton, 0.5, {alpha:0, ease:Power2.easeOut});

        // Text
        var bonusNames = ['Round Bonus', 'Timer Bonus', 'Unused Cards Bonus', 'Total Score'];
        var bonusValues = [roundBonusValue, timerBonusValue, deckSizeBonusValue, totalScore];
        var font = GAME_SIZE_RATIO == 1 ? "12px Titling2" : "24px Titling2"
        for(var i = 0; i < 4; i++)
        {
            var bonusNameLabel = new PIXI.BitmapText(bonusNames[i] + ' :', {font: font, align: "left"});
            bonusNameLabel.position.x = 24 * GAME_SIZE_RATIO;
            bonusNameLabel.position.y = (64 + 32 * i)* GAME_SIZE_RATIO;        
            this.addChild(bonusNameLabel);

            var bonusValueLabel = new PIXI.BitmapText(bonusValues[i] + '', {font: font, align: "right"});
            bonusValueLabel.position.x = panelBG.width - 24 * GAME_SIZE_RATIO - bonusValueLabel.width;
            bonusValueLabel.position.y = (64 + 32 * i)* GAME_SIZE_RATIO;
            this.addChild(bonusValueLabel);
        } 
    };

    this.initialize(timer, deckSize, roundNumber);
};
inheritPrototype(RoundSummaryPanel, PIXI.DisplayObjectContainer);

var CardView = function()
{
    var texture = PIXI.TextureCache['back'];
    PIXI.Sprite.call(this, texture);
    this.card = null; // Model for the card view
    this._callback = null;
    this._isFaceUp = false;
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;

    this.onFaceChange = function(isFaceUp){
        if(this._isFaceUp != isFaceUp)
        {
            this._isFaceUp = isFaceUp;
            TweenMax.to(this.scale, 0.25, 
            {   x:0, 
                onComplete:(function(){
                    if(this._isFaceUp)
                    {
                        var textureId = this.card.getRank()+this.card.getSuit();
                        var texture = PIXI.TextureCache[textureId];
                        this.setTexture(texture);
                    }                        
                    else
                    {
                        var texture = PIXI.TextureCache['back'];
                        this.setTexture(texture);
                    }                    
                    TweenMax.to(this.scale, 0.25, {x:1, ease: Power2.easeOut});
                }),
                onCompleteScope:this,
                ease: Power2.easeIn
            });
        }                
    };

    this.activateTapEvent = function(callback){
        this._callback = callback;
        this.setInteractive(true);        
        this.mousedown = this.touchstart = callback;
    };

    this.deactivateTapEvent = function(){
        this.mousedown = this.touchstart = null;
        this.setInteractive(false);
        this._callback = null;
    };
};
inheritPrototype(CardView, PIXI.Sprite);


var SceneBackground = function()
/** @lends SceneBackground# */
{
    /** 
    * Scene's constructor.
    * @class Main scene
    * @constructs 
    */
    Scene.call(this);
    var bg;
    if (GAME_SIZE_RATIO == 1)
        bg = PIXI.Sprite.fromImage('resources/BG.png');
    else
        bg = PIXI.Sprite.fromImage('resources/BG-hd.png');
    this.addChild(bg);    
};
inheritPrototype(SceneBackground, Scene);

var SceneLoading = function()
/** @lends SceneLevelEditor# */
{
    /** 
    * Scene's constructor.
    * @class Main scene
    * @constructs 
    */
    this.initialize = function(nextScene, direction) 
    {
        Scene.apply(this);
        this.nextScene = nextScene;
        this.direction = direction;        
        if(BannerAd.isEnable)
        {                        
            BannerAd.show(true);
            TweenMax.delayedCall(3, this.finishLoading, null, this);
            var bg = new PIXI.Sprite.fromImage('resources/blackscreen.png');
            bg.scale.x = bg.scale.y = GAME_SIZE_RATIO;
            bg.alpha = 0.75;
            bg.setInteractive(true);
            bg.mousedown = bg.touchstart = function(event)
            {
                return false;           
            };
            this.addChild(bg);
            var font = GAME_SIZE_RATIO == 1 ? "14px Titling" : "28px Titling"
            var label = new PIXI.BitmapText("Now Loading", {font: font, align: "center"});                            
            label.position.x = SceneManager.instance.bounds().x/2 - label.width/2;
            label.position.y = (16)* GAME_SIZE_RATIO;        
            this.addChild(label);
        }else
        {            
            TweenMax.delayedCall(0.1, this.finishLoading, null, this);
        }
    };

    this.finishLoading = function()
    {
        BannerAd.show(false);        
        var nextX, myX;
        if(this.direction == 'left')
        {
            myX = -SceneManager.instance.bounds().x;
            nextX = SceneManager.instance.bounds().x;
        }else
        {
            myX = SceneManager.instance.bounds().x;
            nextX = -SceneManager.instance.bounds().x;
        }         
        if(BannerAd.isEnable)
        {
            TweenMax.to(this.position, 1, {
                x:myX,
                onComplete:(function(){
                    SceneManager.instance.popScene();                    
                    if(this.nextScene === undefined) this.nextScene = SceneManager.instance.currentScene();                    
                    this.nextScene.position.x = nextX;                    
                    TweenMax.to(this.nextScene.position, 1, {x:0, ease:Power2.easeOut});                    
                }),
                onCompleteScope:this,
                ease:Power2.easeIn
            });
        }else       
        {                        
            SceneManager.instance.popScene();
            if(this.nextScene === undefined) this.nextScene = SceneManager.instance.currentScene();            
            this.nextScene.position.x = nextX;
            TweenMax.to(this.nextScene.position, 1, {x:0, ease:Power2.easeOut});            
        }
    };
    this.initialize();
}; 
inheritPrototype(SceneLoading, Scene);

var SceneGameOver = function()
/** @lends SceneLevelEditor# */
{
	BM_API.getAd().addAdvertising300x250(34394, 183342);
    Scene.call(this);
    /** 
    * Scene's constructor.
    * @class Main scene
    * @constructs 
    */
    this.initialize = function() 
    {        
        var bg = new PIXI.Sprite.fromImage('resources/blackscreen.png');
        bg.scale.x = bg.scale.y = GAME_SIZE_RATIO;
        bg.alpha = 0.75;
        bg.setInteractive(true);
        bg.mousedown = bg.touchstart = function(event)
        {
            return false;           
        };
        this.addChild(bg); 

        var panelBG = new PIXI.Sprite.fromFrame('GUI_Blank');        
        this.addChild(panelBG);
        this.bg = panelBG;
        TweenMax.from(panelBG, 0.5, {alpha:0, ease:Power2.easeOut});
        panelBG.position.x = SceneManager.instance.bounds().x/2 - panelBG.width/2;
        panelBG.position.y = SceneManager.instance.bounds().y/2 - panelBG.height/2;

        var gameOverSpr = new PIXI.Sprite.fromFrame('GUI_GameOver');
        gameOverSpr.anchor.x = 0.5;
        gameOverSpr.anchor.y = 0.5;
        gameOverSpr.position.x = SceneManager.instance.bounds().x/2
        gameOverSpr.position.y = SceneManager.instance.bounds().y/2 - 80 * GAME_SIZE_RATIO;
        this.addChild(gameOverSpr);
        TweenMax.from(gameOverSpr.scale, 0.5, {x:0, y:0, ease:Back.easeOut            
        });

        var closeButton = new PIXI.Sprite.fromFrame('GUI_Blank_Button_Close');            
        this.addChild(closeButton);
        this.closeButton = closeButton;
        closeButton.position.x = SceneManager.instance.bounds().x/2 - closeButton.width/2;
        closeButton.position.y = GAME_SIZE_RATIO * 220;
        TweenMax.from(closeButton, 0.5, {alpha:0, ease:Power2.easeOut});
        closeButton.setInteractive(true);
        closeButton.mousedown = closeButton.touchstart = this.returnToPreviousScene;

        var font = GAME_SIZE_RATIO == 1 ? "12px Titling2" : "24px Titling2"

        // Text
        var label = new PIXI.BitmapText(localizedString('final_score'), {font: font, align: "center"});
        label.position.x = SceneManager.instance.bounds().x/2 - label.width/2;
        label.position.y = (128)* GAME_SIZE_RATIO;
        this.addChild(label);

        label = new PIXI.BitmapText(localizedString('round') + ' ' + Profile.roundNumber, {font: font, align: "left"});
        label.position.x = SceneManager.instance.bounds().x/2 - 96 * GAME_SIZE_RATIO;
        label.position.y = (128+ 32)* GAME_SIZE_RATIO;
        this.addChild(label);

        label = new PIXI.BitmapText(Profile.score+'', {font: font, align: "left"});        
        label.position.x = SceneManager.instance.bounds().x/2 + 96 * GAME_SIZE_RATIO - label.width/2;
        label.position.y = (128+ 32)* GAME_SIZE_RATIO;
        this.addChild(label);
    };

    this.returnToPreviousScene = function()
    {
        SceneManager.instance.popScene();
        SceneManager.instance.currentScene().returnToTitle();      
    };

    this.initialize();
};
inheritPrototype(SceneGameOver, Scene);

function ScoreEntry(roundNumber, score) 
{
    this.roundNumber = roundNumber;
    this.score = score;
};

// ==============================================
//  PopupScore
// ----------------------------------------------
//  Popup score effect when you merge gems
// ==============================================
var PopupScore = function(txt){
    
    PIXI.DisplayObjectContainer.call(this);
    var font = GAME_SIZE_RATIO == 1 ? "14px Titling" : "28px Titling"
    this.label = new PIXI.BitmapText(txt, {font: font, align: "center"});
    this.addChild(this.label);
    
    this.setup = function(amount, combo)
    {
        // Setup text
        this.label.setText('+' + amount);
    };
};
inheritPrototype(PopupScore, PIXI.DisplayObjectContainer);

// ==============================================
//  PopupScorePool
// ----------------------------------------------
//  Pool for popup score effect
// ==============================================
var PopupScorePool = function()
{
    PIXI.DisplayObjectContainer.call(this);
    this.pool = [];
    
    this.get = function()
    {
        var popup = this.pool.pop();
        if(popup === undefined)
        {
            popup = new PopupScore("test");
        }
        return popup;
    };

    this.remove = function(obj)
    {
        obj.parent.removeChild(obj);
        this.pool.push(obj);        
    };
};
inheritPrototype(PopupScorePool, PIXI.DisplayObjectContainer);

var SceneHighScores = function(nextScene)
/** @lends SceneLevelEditor# */
{
    /** 
    * Scene's constructor.
    * @class Main scene
    * @constructs 
    */
    this.nextScene = nextScene;
    Scene.call(this);

    var bg = new PIXI.Sprite.fromImage('resources/blackscreen.png');
    bg.scale.x = bg.scale.y = GAME_SIZE_RATIO;
    bg.alpha = 0.75;
    bg.setInteractive(true);
    bg.mousedown = bg.touchstart = function(event)
    {
        return false;           
    };
    this.addChild(bg);   

    var halfScreenWidth = SceneManager.instance.bounds().x/2;
    var halfScreenHeight = SceneManager.instance.bounds().y/2;

    var panel = new PIXI.DisplayObjectContainer();
    
    var panelBG = new PIXI.Sprite.fromFrame('GUI_Blank');
    panelBG.position.x = halfScreenWidth - panelBG.width/2;
    panelBG.position.y = halfScreenHeight - panelBG.height/2;
    panelBG.setInteractive(true);
    panelBG.mousedown = panelBG.touchstart = function(data){return false;};    
    panel.addChild(panelBG);

    var panelHeader = new PIXI.Sprite.fromFrame('GUI_Blank_Header_HS');
    panelHeader.position.x = halfScreenWidth - panelHeader.width/2;
    panelHeader.position.y = GAME_SIZE_RATIO * 46;    
    panel.addChild(panelHeader);

    var titleButton = new PIXI.Sprite.fromFrame('GUI_Blank_Button_Close');
    titleButton.position.x = halfScreenWidth - titleButton.width/2;
    titleButton.position.y = GAME_SIZE_RATIO * 250;
    titleButton.buttonMode = true;
    titleButton.setInteractive(true);        
    panel.addChild(titleButton);
    this.addChild(panel);

    for(var i = 0; i < Profile.highscoreEntries.length; i++)
    {            
        var entry = Profile.highscoreEntries[i];
        var font = GAME_SIZE_RATIO == 1 ? "12px Titling2" : "24px Titling2"
        var roundLabel = new PIXI.BitmapText(localizedString('round') + ' ' + entry.roundNumber, 
            {font: font, align: "left"});
        roundLabel.position.x = halfScreenWidth - 100 * GAME_SIZE_RATIO;
        roundLabel.position.y = (64 + 24 * i)* GAME_SIZE_RATIO;        
        this.addChild(roundLabel);

        var scoreLabel = new PIXI.BitmapText(entry.score+'', 
            {font: font, align: "right"});                
        scoreLabel.position.x = halfScreenWidth + 100 * GAME_SIZE_RATIO - scoreLabel.width;
        scoreLabel.position.y = (64 + 24 * i)* GAME_SIZE_RATIO;        
        this.addChild(scoreLabel);
    }    

    this.returnToPreviousScene = function(event)
    {
        var scene = SceneManager.instance.currentScene();
        SceneManager.instance.popScene();
        if(scene.nextScene !== undefined)
        {
            SceneManager.instance.pushScene(scene.nextScene);
        }
    };
    titleButton.mousedown = titleButton.touchstart = this.returnToPreviousScene;
};
inheritPrototype(SceneHighScores, Scene);

var SceneCredits = function(nextScene)
/** @lends SceneLevelEditor# */
{
    /** 
    * Scene's constructor.
    * @class Main scene
    * @constructs 
    */
    this.nextScene = nextScene;
    Scene.call(this);

    var bg = new PIXI.Sprite.fromImage('resources/blackscreen.png');
    bg.scale.x = bg.scale.y = GAME_SIZE_RATIO;
    bg.alpha = 0.75;
    bg.setInteractive(true);
    bg.mousedown = bg.touchstart = function(event)
    {
        return false;           
    };
    this.addChild(bg);

    var halfScreenWidth = SceneManager.instance.bounds().x/2;
    var halfScreenHeight = SceneManager.instance.bounds().y/2;

    var panel = new PIXI.DisplayObjectContainer();
    
    var panelBG = new PIXI.Sprite.fromFrame('GUI_Blank');
    panelBG.position.x = halfScreenWidth - panelBG.width/2;
    panelBG.position.y = halfScreenHeight - panelBG.height/2;
    panelBG.setInteractive(true);
    panelBG.mousedown = panelBG.touchstart = function(data){return false;};    
    panel.addChild(panelBG);

    var panelHeader = new PIXI.Sprite.fromFrame('GUI_Blank_Header_Credits');
    panelHeader.position.x = halfScreenWidth - panelHeader.width/2;
    panelHeader.position.y = GAME_SIZE_RATIO * 46;    
    panel.addChild(panelHeader);

    var titleButton = new PIXI.Sprite.fromFrame('GUI_Blank_Button_Close');
    titleButton.position.x = halfScreenWidth - titleButton.width/2;
    titleButton.position.y = GAME_SIZE_RATIO * 250;
    titleButton.buttonMode = true;
    titleButton.setInteractive(true);        
    panel.addChild(titleButton);
    this.addChild(panel); 

    // Text
    var bonusNames = ['Programmer and Designer', 'Graphics and User Interface', 'Special Thanks'];
    var bonusValues = ['Guts Rodsavas', 'Piti Yindee', 'Ryuji'];
    var font = GAME_SIZE_RATIO == 1 ? "12px Titling2" : "24px Titling2"
    for(var i = 0; i < 3; i++)
    {
        var bonusNameLabel = new PIXI.BitmapText(bonusNames[i], {font: font, align: "left"});            
        bonusNameLabel.position.x = halfScreenWidth - bonusNameLabel.width/2;
        bonusNameLabel.position.y = (72 + 64 * i)* GAME_SIZE_RATIO;        
        this.addChild(bonusNameLabel);

        var bonusValueLabel = new PIXI.BitmapText(bonusValues[i], {font: font, align: "left"});            
        bonusValueLabel.position.x = halfScreenWidth - bonusValueLabel.width/2;
        bonusValueLabel.position.y = (72 + 16 + 64 * i)* GAME_SIZE_RATIO;   
        this.addChild(bonusValueLabel);
    } 

    this.returnToPreviousScene = function(event)
    {
        // console.log("Da");
        var scene = SceneManager.instance.currentScene();
        SceneManager.instance.popScene();
        if(scene.nextScene !== undefined)
        {
            SceneManager.instance.pushScene(scene.nextScene);
        }
    };
    titleButton.mousedown = titleButton.touchstart = this.returnToPreviousScene;
};
inheritPrototype(SceneCredits, Scene);

var SceneInstructions = function(nextScene)
/** @lends SceneLevelEditor# */
{
    /** 
    * Scene's constructor.
    * @class Main scene
    * @constructs 
    */
    this.nextScene = nextScene;
    Scene.call(this);

    var bg = new PIXI.Sprite.fromImage('resources/blackscreen.png');
    bg.scale.x = bg.scale.y = GAME_SIZE_RATIO;
    bg.alpha = 0.75;
    bg.setInteractive(true);
    bg.mousedown = bg.touchstart = function(event)
    {
        return false;           
    };
    this.addChild(bg);

    var halfScreenWidth = SceneManager.instance.bounds().x/2;
    var halfScreenHeight = SceneManager.instance.bounds().y/2;

    var panel = new PIXI.DisplayObjectContainer();
    
    var panelBG = new PIXI.Sprite.fromFrame('GUI_Blank');
    panelBG.position.x = halfScreenWidth - panelBG.width/2;
    panelBG.position.y = halfScreenHeight - panelBG.height/2;
    panelBG.setInteractive(true);
    panelBG.mousedown = panelBG.touchstart = function(data){return false;};    
    panel.addChild(panelBG);

    var panelHeader = new PIXI.Sprite.fromFrame('GUI_Blank_Header_Credits');
    panelHeader.position.x = halfScreenWidth - panelHeader.width/2;
    panelHeader.position.y = GAME_SIZE_RATIO * 46;    
    panel.addChild(panelHeader);

    var titleButton = new PIXI.Sprite.fromFrame('GUI_Blank_Button_Close');
    titleButton.position.x = halfScreenWidth - titleButton.width/2;
    titleButton.position.y = GAME_SIZE_RATIO * 250;
    titleButton.buttonMode = true;
    titleButton.setInteractive(true);        
    panel.addChild(titleButton);
    this.addChild(panel); 
        
    // Text
    var bonusNames = [localizedString('help_line_1'),
                      localizedString('help_line_2'), 
                      localizedString('help_line_3'),
                      localizedString('help_line_4'), 
                      localizedString('help_line_5'),
                      localizedString('help_line_6'),
                      localizedString('help_line_7'),
                      ''
        ];
    var font = GAME_SIZE_RATIO == 1 ? "10px Titling2" : "20px Titling2"        
    for(var i = 0; i < bonusNames.length; i++)
    {        
        var bonusNameLabel = new PIXI.BitmapText(bonusNames[i], {font: font, align: "left"});        
        bonusNameLabel.position.x = halfScreenWidth - bonusNameLabel.width/2;
        bonusNameLabel.position.y = (64 + 24 * i + 8 * ((i+1)%2))* GAME_SIZE_RATIO;    
        this.addChild(bonusNameLabel);
    }         

    this.returnToPreviousScene = function(event)
    {
        // console.log("Da");
        var scene = SceneManager.instance.currentScene();
        SceneManager.instance.popScene();
        if(scene.nextScene !== undefined)
        {
            SceneManager.instance.pushScene(scene.nextScene);
        }
    };
    titleButton.mousedown = titleButton.touchstart = this.returnToPreviousScene;
};
inheritPrototype(SceneInstructions, Scene);

var ScenePause = function()
/** @lends SceneLevelEditor# */
{
    Scene.call(this);
    /** 
    * Scene's constructor.
    * @class Main scene
    * @constructs 
    */
    this.initialize = function() 
    {        
        var bg = new PIXI.Sprite.fromImage('resources/blackscreen.png');
        bg.alpha = 0.75;
        bg.setInteractive(true);
        bg.scale.x = bg.scale.y = GAME_SIZE_RATIO;
        bg.mousedown = bg.touchstart = function(event)
        {
            return false;           
        };
        this.addChild(bg);

        var halfScreenWidth = SceneManager.instance.bounds().x/2;

        var panel = new PIXI.DisplayObjectContainer();
        
        var panelBG = new PIXI.Sprite.fromFrame('GUI_Blank');
        panelBG.position.x = SceneManager.instance.bounds().x/2 - panelBG.width/2;
        panelBG.position.y = SceneManager.instance.bounds().y/2 - panelBG.height/2;
        panel.addChild(panelBG);

        var panelHeader = new PIXI.Sprite.fromFrame('GUI_Blank_Header_Pause');
        panelHeader.position.x = halfScreenWidth - panelHeader.width/2;
        panelHeader.position.y = GAME_SIZE_RATIO * 46;
        panel.addChild(panelHeader);

        var continueButton = new PIXI.Sprite.fromFrame('GUI_Blank_Button_Cont');
        continueButton.position.x = halfScreenWidth - continueButton.width/2;
        continueButton.position.y = GAME_SIZE_RATIO * 106;
        continueButton.setInteractive(true);
        continueButton.mousedown = continueButton.touchstart = this.returnToPreviousScene;        
        panel.addChild(continueButton);

        var instructionsButton = new PIXI.Sprite.fromFrame('GUI_Blank_Button_Ins');
        instructionsButton.position.x = halfScreenWidth - instructionsButton.width/2;
        instructionsButton.position.y = GAME_SIZE_RATIO * 162;
        instructionsButton.setInteractive(true);
        instructionsButton.mousedown = instructionsButton.touchstart = this.showInstructions;        
        panel.addChild(instructionsButton);

        var titleButton = new PIXI.Sprite.fromFrame('GUI_Blank_Button_Back');
        titleButton.position.x = halfScreenWidth - titleButton.width/2;
        titleButton.position.y = GAME_SIZE_RATIO * 220;
        titleButton.setInteractive(true);
        titleButton.mousedown = titleButton.touchstart = this.returnToTitle;        
        panel.addChild(titleButton);
        
        this.addChild(panel);
    };

    this.showInstructions = function()
    {
        var prevScene = SceneManager.instance.currentScene();        
        SceneManager.instance.popScene();
        SceneManager.instance.pushScene(new SceneInstructions(prevScene));
    };

    this.returnToPreviousScene = function()
    {        
        SceneManager.instance.popScene();
        TweenMax.resumeAll(true, false);        
    };

    this.returnToTitle = function()
    {
        SceneManager.instance.popScene();        
        SceneManager.instance.currentScene().returnToTitle();
        TweenMax.resumeAll(true, false);
    };
    this.initialize();
};
inheritPrototype(ScenePause, Scene);

var SceneTitle = function()
{
    /** 
    * Scene's constructor.
    * @class Main scene
    * @constructs 
    */
    Scene.call(this);
    var logo = new PIXI.Sprite.fromFrame('GUI_Logo');
    this.addChild(logo);
    logo.anchor.x = 0.5;
    logo.anchor.y = 0.5;
    logo.position.x = GAME_SIZE_RATIO * 253;
    logo.position.y = GAME_SIZE_RATIO * 113.25;

    this.logo = logo;
    this.firstEnter = false;
    this.addChild(logo);         

    var playButton = new PIXI.Sprite.fromFrame('GUI_Mainmenu_Play');
    playButton.anchor.x = 0.5;
    playButton.anchor.y = 0.5;
    playButton.position.x = GAME_SIZE_RATIO * 477.5 * 0.5;
    playButton.position.y = GAME_SIZE_RATIO * 408.5 * 0.5;
    playButton.buttonMode = true;
    this.playButton = playButton;        
    this.addChild(playButton);

    var highscoreButton = new PIXI.Sprite.fromFrame('GUI_Mainmenu_HighScores');
    highscoreButton.anchor.x = 0.5;
    highscoreButton.anchor.y = 0.5;
    highscoreButton.position.x = GAME_SIZE_RATIO * 355.5 * 0.5;
    highscoreButton.position.y = GAME_SIZE_RATIO * 485.5 * 0.5;
    highscoreButton.buttonMode = true;
    this.highscoreButton = highscoreButton;
    //this.addChild(highscoreButton);

    var instructionsButton = new PIXI.Sprite.fromFrame('GUI_Mainmenu_Instructions');
    instructionsButton.anchor.x = 0.5;
    instructionsButton.anchor.y = 0.5;
    instructionsButton.position.x = GAME_SIZE_RATIO * 476 * 0.5;
    instructionsButton.position.y = GAME_SIZE_RATIO * 485.5 * 0.5;
    instructionsButton.buttonMode = true;
    this.instructionsButton = instructionsButton;
    this.addChild(instructionsButton);

    var creditsButton = new PIXI.Sprite.fromFrame('GUI_Mainmenu_Credits');
    creditsButton.anchor.x = 0.5;
    creditsButton.anchor.y = 0.5;
    creditsButton.position.x = GAME_SIZE_RATIO * 477.5 * 0.5;
    creditsButton.position.y = GAME_SIZE_RATIO * 563.5 * 0.5;
    creditsButton.buttonMode = true;
    this.creditsButton = creditsButton;
    this.addChild(creditsButton);

    var moreGamesButton = new PIXI.Sprite.fromFrame('GUI_MainMenu_MoreGames');
    moreGamesButton.anchor.x = 0.5;
    moreGamesButton.anchor.y = 0.5;
    moreGamesButton.position.x = SceneManager.instance.bounds().x - moreGamesButton.width - 16 * GAME_SIZE_RATIO;
    moreGamesButton.position.y = 16 * GAME_SIZE_RATIO;    
    moreGamesButton.buttonMode = true;
    moreGamesButton.setInteractive(true);
    moreGamesButton.mousedown = moreGamesButton.touchstart = function(event)
    {
        goToMoreGames();
    };
    this.moreGamesButton = moreGamesButton;
    this.addChild(moreGamesButton);

    // Create text
    var creditLabel = new PIXI.Text("2013 (c) Coffee Dog Games", 
                     {font: "8px verdana", fill: "white", align: "left"});
    creditLabel.position.x = SceneManager.instance.bounds().x - 130 * GAME_SIZE_RATIO;
    creditLabel.position.y = SceneManager.instance.bounds().y - 16 * GAME_SIZE_RATIO;
    this.creditLabel = creditLabel;    
    this.addChild(creditLabel);
    
    this.enterScene = function()
    {
        if(!this.firstEnter)
        {
            TweenMax.from(this.logo.scale, 2, {x:0, y:0, ease:Elastic.easeOut});            
            this.firstEnter = true;
            if(this.hdLogo)
            {
                TweenMax.to(this.hdLogo.scale, 0.5, {x:1, y:1, ease:Elastic.easeOut, delay:1.5});
            }
        }
        Profile.resetGame();
        this.playButton.setInteractive(true);
        this.playButton.mousedown = this.playButton.touchstart = function(event)
        {
            this.setInteractive(false);
            this.parent.clearButtonEventListeners();            
            TweenMax.to(this.parent.position, 1, {
                x:-SceneManager.instance.bounds().x,
                onComplete:(function(){
                    var sceneGame = new SceneGame();                    
                    TweenMax.from(sceneGame.position, 1, {x:SceneManager.instance.bounds().x, ease:Power2.easeOut});
                    SceneManager.instance.pushScene(sceneGame);                    
                }),
                onCompleteScope:this,
                ease:Power2.easeIn
            });                    
        };
        this.highscoreButton.setInteractive(true);
        this.instructionsButton.setInteractive(true);
        this.creditsButton.setInteractive(true);
        this.highscoreButton.mousedown = this.highscoreButton.touchstart = this.showHighScores;
        this.instructionsButton.mousedown = this.instructionsButton.touchstart = this.showInstructions;
        this.creditsButton.mousedown = this.creditsButton.touchstart = this.showCredits;
    };
    this.on(Scene.EVENT_ON_ENTER, this.enterScene);    

    this.clearButtonEventListeners = function()
    {
        this.playButton.setInteractive(false);
        this.highscoreButton.setInteractive(false);
        this.instructionsButton.setInteractive(false);
        this.creditsButton.setInteractive(false);
    };    

    this.showInstructions = function(event)
    {        
        SceneManager.instance.pushScene(new SceneInstructions());
    };

    this.showCredits = function(event)
    {
        SceneManager.instance.pushScene(new SceneCredits());        
    };

    this.showHighScores = function(event)
    {        
        SceneManager.instance.pushScene(new SceneHighScores());                
    };
};
inheritPrototype(SceneTitle, Scene);

var SceneGame = function(roundNumber) 
/** @lends SceneGame# */
{
    /** 
    * Scene's constructor.
    * @class Main scene
    * @constructs 
    */
    this.initialize = function(roundNumber)
    {
        Scene.call(this);    
        roundNumber = roundNumber || 1;
        
        BM_API.getAnalytics().eventLevelStart();

        // Layers
        this.bottomUILayer = new PIXI.DisplayObjectContainer();
        this.cardsLayer = new PIXI.DisplayObjectContainer();
        this.uiLayer = new PIXI.DisplayObjectContainer();

        this.addChild(this.bottomUILayer);
        this.addChild(this.cardsLayer);
        this.addChild(this.uiLayer);

        this.blockingClickSprite = new PIXI.Sprite.fromImage('resources/blackscreen.png');
        this.blockingClickSprite.scale.x = this.blockingClickSprite.scale.y = GAME_SIZE_RATIO;
        this.blockingClickSprite.alpha = 0;
        this.blockingClickSprite.visible = true;
        this.blockingClickSprite.setInteractive(true);
        this.blockingClickSprite.mousedown = this.blockingClickSprite.touchstart = function(event)
        {
            return false;           
        };
        this.addChild(this.blockingClickSprite);

        // ----------------------------------------
        //              User Interface
        // ----------------------------------------
        var roundNumberPicture = new PIXI.Sprite.fromFrame('GUI_Round');
        roundNumberPicture.position.x = SceneManager.instance.bounds().x/2 - roundNumberPicture.width/2;
        roundNumberPicture.position.y = 16 * GAME_SIZE_RATIO;
        this.uiLayer.addChild(roundNumberPicture);

        // Undo Button
        var undoButton = new PIXI.Sprite.fromFrame('GUI_Button_Undo');        
        undoButton.position.x = GAME_SIZE_RATIO * (240 + 74);
        undoButton.position.y = GAME_SIZE_RATIO * 250;
        undoButton.sceneGroup = this;
        undoButton.setInteractive(true);
        undoButton.mousedown = undoButton.touchstart = function(event)
        {
            var scene = this.sceneGroup;
            scene.undoLastAction();
        };    

        this.uiLayer.addChild(undoButton);
        undoButton.opacity = 0.5;
        this.undoButton = undoButton;

        // Pause Button
        var pauseButton = new PIXI.Sprite.fromFrame('GUI_Button_Pause');        
        pauseButton.position.x = GAME_SIZE_RATIO * 48;
        pauseButton.position.y = SceneManager.instance.bounds().y - 32 * GAME_SIZE_RATIO;
        this.uiLayer.addChild(pauseButton);
        pauseButton.setInteractive(true);
        pauseButton.mousedown = pauseButton.touchstart = function(event)
        {
            var scene = this.parent;
            var newScene = new ScenePause();            
            SceneManager.instance.pushScene(newScene);
            TweenMax.pauseAll(true, false);
        };
        this.pauseButton = pauseButton;

        var font = GAME_SIZE_RATIO == 1 ? "12px Titling2" : "24px Titling2"
        var font2 = GAME_SIZE_RATIO == 1 ? "14px Titling" : "28px Titling"
        
        // Score Label
        var scoreLabel = new PIXI.Sprite.fromFrame('GUI_Score');
        scoreLabel.position.x = 16 * GAME_SIZE_RATIO;
        scoreLabel.position.y = 17.5 * GAME_SIZE_RATIO;
        this.uiLayer.addChild(scoreLabel);

        // Time Label
        var timeLabel = new PIXI.Sprite.fromFrame('GUI_Time');
        timeLabel.position.x = SceneManager.instance.bounds().x - timeLabel.width - 16 * GAME_SIZE_RATIO;
        timeLabel.position.y = 17.5 * GAME_SIZE_RATIO;
        this.uiLayer.addChild(timeLabel);
         
        var scoreValueLabel = new PIXI.BitmapText(Profile.score+'', {font: font2, align: "left"});     
        scoreValueLabel.position.x = 15 * GAME_SIZE_RATIO;
        scoreValueLabel.position.y = 32 * GAME_SIZE_RATIO;        
        this.addChild(scoreValueLabel);
        this.scoreValueLabel = scoreValueLabel;

        var timeValueLabel = new PIXI.BitmapText("01:00", {font: font2, align: "center"});
        timeValueLabel.position.x = SceneManager.instance.bounds().x - 35 * GAME_SIZE_RATIO;
        timeValueLabel.position.y = 32 * GAME_SIZE_RATIO;        
        this.addChild(timeValueLabel);
        this.timeValueLabel = timeValueLabel;

        var roundNumberLabel = new PIXI.BitmapText(roundNumber + '', {font: font, align: "center"});
        roundNumberLabel.position.x = SceneManager.instance.bounds().x/2 + 24 * GAME_SIZE_RATIO;
        roundNumberLabel.position.y = 18.5 * GAME_SIZE_RATIO;   
        this.addChild(roundNumberLabel);
        this.roundNumberLabel = roundNumberLabel;

        var endRoundButton = new PIXI.Sprite.fromFrame('GUI_EndGame');
        endRoundButton.anchor.x = 0.5;
        endRoundButton.anchor.y = 0.5;
        endRoundButton.position.x = GAME_SIZE_RATIO * (240 - 36);
        endRoundButton.position.y = GAME_SIZE_RATIO * 260;        
        endRoundButton.visible = false;
        endRoundButton.sceneGroup = this;
        endRoundButton.setInteractive(true);
        endRoundButton.mousedown = endRoundButton.touchstart = function(event)
        {
            if(endRoundButton.sceneGroup.totalDeck.getSize() <= 0)
            {
                endRoundButton.sceneGroup.endGame();                  
            }
        };
        this.bottomUILayer.addChild(endRoundButton);
        this.endRoundButton = endRoundButton;

        var reserveButton = new PIXI.Sprite.fromFrame('GUI_Reserve');
        reserveButton.position.x = GAME_SIZE_RATIO * (240 + 150) - reserveButton.width/2;
        reserveButton.position.y = GAME_SIZE_RATIO * 260 - reserveButton.height/2;
        reserveButton.sceneGroup = this;
        reserveButton.setInteractive(true);
        reserveButton.mousedown = reserveButton.touchstart = function(event)
        {
            var _scene = this.sceneGroup;
            var _foundationCard = _scene.foundationDeck.peek();

            if(_scene.reserveDeck.getSize() <= 0 )
            {
                var lastAction = {type:UNDO_TYPE_SAVE_TO_RESERVE};
                _scene.foundationDeck.remove(_foundationCard);
                _scene.reserveDeck.addTop(_foundationCard);

                // Draw a new card if foundation is empty
                if(_scene.foundationDeck.getSize() <= 0)
                {
                    _scene.totalDeck.sendCardToFoundationDeck(_scene.totalDeck.peek());
                    lastAction.drawFromDeck = true;
                }   
                _scene.saveLastAction(lastAction);                             
            }                    
        };
        this.bottomUILayer.addChild(reserveButton);
        this.reserveButton = reserveButton;

        this.popupPool = new PopupScorePool();
        this.uiLayer.addChild(this.popupPool);

        // ----------------------------------------
        //              Deck of Cards
        // ----------------------------------------
        // Main Deck.
        // The total deck on the left side for replacing new card
        var totalDeck = new Deck(null, GAME_SIZE_RATIO * (240 - 36), GAME_SIZE_RATIO * 260);
        totalDeck.sceneGroup = this;
        totalDeck.name = "Total Deck";
        totalDeck.initialize(true);
        totalDeck.shuffle();
        for (var i = 0; i < totalDeck.getCards().length; i++) {
            var card = totalDeck.getCards()[i];
            var cardView = new CardView();
            cardView.position.x = SceneManager.instance.bounds().x/2;
            cardView.position.y = SceneManager.instance.bounds().y + cardView.height/2;
            cardView.scale.x = cardView.scale.y = 1;
            cardView.card = card;
            cardView.rotation = (-3 + Math.random()*6) * Math.PI/180;
            card.setView(cardView);
            this.cardsLayer.addChild(cardView);
        };

        totalDeck.readjustCards = function()
        {
            for (var i = 0; i < this.getCards().length; i++) {
                var card = this.getCards()[i];
                var cardView = card.getView();
                cardView.position.x = this.getXPosFromIndex(i);                
            };
        }

        totalDeck.getXPosFromIndex = function(index){
            var xPos = this.getX();
            xPos = xPos - 3 * (this.getCards().length - index);
            return xPos;
        };

        totalDeck.onClickCard = function(event){ 
            var _scene = totalDeck.sceneGroup;                       
            var _totalDeck = _scene.totalDeck;
            _totalDeck.sendCardToFoundationDeck(event.target.card);            

            // Save last action
            _totalDeck.readjustCards();
            var lastAction = {type:UNDO_TYPE_DRAW};
            _scene.saveLastAction(lastAction);
            _scene.resetChain();
        };

        totalDeck.sendCardToFoundationDeck = function(card){
            var _scene = totalDeck.sceneGroup;            
            var _foundationDeck = _scene.foundationDeck;            
            var _totalDeck = _scene.totalDeck;            
            var _selectedCard = card;

            // Flip and send to foundation
            _selectedCard.setFaceUp(true);
            _selectedCard.getView().deactivateTapEvent();
            _totalDeck.remove(_selectedCard);
            _foundationDeck.addTop(_selectedCard);
            _totalDeck.activateTopCard();
        };

        totalDeck.activateTopCard = function()
        {
            if(this.getSize() > 0)
                this.peek().getView().activateTapEvent(this.onClickCard);
        };

        totalDeck.deactivateTopCard = function()
        {
            if(this.getSize() > 0)
                this.peek().getView().deactivateTapEvent();
        };

        totalDeck.observe((function (totalDeck) {
            return function (event) {
                if (event.type === "add") {                     
                    var card = event.card;
                    if(card !== undefined)
                    {                                                
                        var cardView = card.getView();
                        var posX = cardView.position.x;
                        totalDeck.readjustCards();
                        cardView.position.x = posX;                        
                        TweenMax.to(cardView.position, 0.5, 
                                {
                                 x: totalDeck.getXPosFromIndex(totalDeck.getCards().length - 1), 
                                 y: totalDeck.getY()
                                });
                        card.setFaceUp(false);
                    }                    
                }
            };
        })(totalDeck));
        this.totalDeck = totalDeck;

        // Foundation Deck.
        // This is the deck where player will put their cards in
        var foundationDeck = new Deck(null, GAME_SIZE_RATIO * (240 + 40), GAME_SIZE_RATIO * 260);
        foundationDeck.sceneGroup = this;
        foundationDeck.observe((function (foundationDeck) {
            return function (event) {
                if (event.type === "add") 
                {                 
                    var card = event.card;
                    if(card !== undefined)
                    {
                        var cardView = card.getView();
                        var scene = foundationDeck.sceneGroup;
                        scene.putCardToFront(card);                                              
                        if(event.from && event.from === scene.playArea)
                        {
                            var mx = cardView.position.x - foundationDeck.getX();
                            mx /= 2;
                            TweenMax.to(cardView, 0.75, 
                                {
                                    rotation:720 * Math.PI/180,
                                    onComplete:(function(){this.rotation = 0;}),
                                    onCompleteScope: cardView,
                                    ease:Linear.easeInOut                                    
                                });
                            TweenMax.to(cardView.position, 0.25, 
                                {
                                 x: cardView.position.x - mx, 
                                 y: cardView.position.y - 24,
                                 onComplete:(function(cardView, foundationDeck){
                                    TweenMax.to(cardView.position, 0.5, 
                                    {
                                        x: foundationDeck.getX(), 
                                        y: foundationDeck.getY(),
                                        ease:Sine.easeIn,                                        
                                    });
                                 }),
                                 onCompleteParams:[cardView, foundationDeck],
                                 ease:Sine.easeOut                              
                                });
                        }else
                        {
                            TweenMax.to(cardView.position, 0.5, 
                                {
                                 x: foundationDeck.getX(), 
                                 y: foundationDeck.getY()                               
                                });
                        }                                      
                    }                    
                }
            };
        })(foundationDeck));
        this.foundationDeck = foundationDeck;

        // Play Area Deck
        // Area where player will try to clear all the cards
        var playArea = new Deck(null, GAME_SIZE_RATIO * 240, GAME_SIZE_RATIO * 48);    
        playArea.cardDict = {};       
        playArea.layoutInfo = layoutInfo;
        playArea.name = "Play Area";
        playArea.sceneGroup = this;

        playArea.adjustByLayoutInfo = function()
        {
            for(var i = 0; i < this.getCards().length; i++)
            {
                var card = this.getCards()[i];
                var cardData = this.layoutInfo.cards[card.id-1];
                for(var j = 0; j < cardData.covered.length; j++)
                {
                    var cardId = cardData.covered[j];                    
                    var anotherCard = this.cardDict[cardId];                    
                    anotherCard.cover(card);
                }
            }
        };

        playArea.onClickCard = function(event){            
            var _scene = playArea.sceneGroup;
            var _foundationDeck = _scene.foundationDeck;
            var _playArea = _scene.playArea;
            var _selectedCard = event.target.card;
            var _foundationCard = _foundationDeck.peek();
            if(Tripeak.checkPossibleMove(_selectedCard, _foundationCard))
            {                
                // Saved action
                var lastAction = {};
                lastAction.type = UNDO_TYPE_PICKUP;
                lastAction.lastCard = _selectedCard;
                lastAction.lastCardPosition = { x: _selectedCard.getView().x, 
                                                y: _selectedCard.getView().y}
                lastAction.faceUpCards = [];

                // Move the clicked card to the foundation deck
                _selectedCard.pickUp();
                // Check if we should add touch event to the cards this card is covering
                var coveringCards = _selectedCard.seeCovering();
                for (var i = 0; i < coveringCards.length; i++) {
                    lastAction.faceUpCards.push(coveringCards[i]);
                    if( coveringCards[i].canPickUp() )
                    {
                        coveringCards[i].getView().activateTapEvent(_playArea.onClickCard);                        
                    }
                };
                _selectedCard.getView().deactivateTapEvent();
                _playArea.remove(_selectedCard);                

                // Gain score
                _scene.increaseChain();
                var scoreGain = _scene.calculateScoreGainWithGivenChain(BASE_CARD_SCORE, _scene.chain);
                _scene.gainScore(scoreGain);
                _scene.showScorePopup(_selectedCard.getView().position.x,
                                      _selectedCard.getView().position.y,
                                      scoreGain, _scene.chain);
                lastAction.scoreGain = scoreGain;

                // Send last action to our scene
                _scene.saveLastAction(lastAction);
                

                _foundationDeck.addTop(_selectedCard, _playArea);
                if(_playArea.getSize() <= 0)
                {
                    _scene.endGame();
                }
            }
        };

        playArea.observe((function (playArea) {
            return function (event) {
                if (event.type === "add") 
                {                 
                    var card = event.card;
                    var delay = true;
                    if(card !== undefined)
                    {              
                        if(card.id) delay = false;        
                        card.id = card.id || playArea.getCards().length;
                        playArea.cardDict[card.id] = card;

                        var index = card.id - 1;
                        var cardView = card.getView();
                        var maxCardsInRow = 0;
                        playArea.sceneGroup.putCardToFront(card);                        
                        var realIndex = index;
                        if(index < 3)
                        {
                            row = 0;
                            maxCardsInRow = 7;
                            if(index === 1)
                            {
                                index = 3;
                            }else if(index === 2)
                            {
                                index = 6;
                            }
                        }else if(index < 9)
                        {
                            row = 1;
                            index -= 3;
                            maxCardsInRow = 8;
                            if(index >= 2 && index <= 3)
                            {
                                index += 1;
                            }else if(index >= 4 && index <= 5)
                            {
                                index += 2;
                            }
                        }else if(index < 18)
                        {
                            row = 2;
                            index -= 9;
                            maxCardsInRow = 9;
                        }else
                        {
                            row = 3;
                            index -= 18;
                            maxCardsInRow = 10;
                            card.setFaceUp(true);
                            card.getView().activateTapEvent(playArea.onClickCard);
                        }
                        var w = cardView.width * cardView.scale.x * maxCardsInRow;
                        cardView.finalX = -w/2 + w/maxCardsInRow * index + playArea.getX();
                        cardView.finalY = playArea.getY() + cardView.height * cardView.scale.y * 0.6 * row;
                        TweenMax.to(cardView.position, 0.25, {x: cardView.finalX + cardView.width/2, y: cardView.finalY + cardView.height/2,delay: !delay ? 0 : 0.05 * realIndex});                                   
                    }                    
                }
            };
        })(playArea));
        this.playArea = playArea;

        // Reserve Deck
        // Player can save a card here        
        var reserveDeck = new Deck(null, 
                                    GAME_SIZE_RATIO * (240 + 150), 
                                    GAME_SIZE_RATIO * 260);
        reserveDeck.sceneGroup = this;
        reserveDeck.onClickCard = function(event){
            // Prepare variables
            var _scene = reserveDeck.sceneGroup;            
            var _foundationDeck = _scene.foundationDeck;            
            var _reserveDeck = _scene.reserveDeck;            
            var _selectedCard = event.target.card;
            var _foundationCard = _foundationDeck.peek();

            // Deal from reserve deck to foundation
            _selectedCard.getView().deactivateTapEvent();
            _reserveDeck.remove(_selectedCard);
            _foundationDeck.addTop(_selectedCard);
            _foundationDeck.remove(_foundationCard);
            _reserveDeck.addTop(_foundationCard);

            // Save last action
            var lastAction = {type:UNDO_TYPE_TAKE_FROM_RESERVE};
            _scene.saveLastAction(lastAction);            
        };

        reserveDeck.observe((function (reserveDeck) {
            return function (event) {
                if (event.type === "add") 
                {                 
                    var card = event.card;                    
                    if(card !== undefined)
                    {              
                        var cardView = card.getView();                        
                        TweenMax.to(cardView.position, 0.5, 
                        {
                         x: reserveDeck.getX(), 
                         y: reserveDeck.getY()
                        });
                        cardView.activateTapEvent(reserveDeck.onClickCard);
                    }                    
                }
            };
        })(reserveDeck));
        this.reserveDeck = reserveDeck;



        // ----------------------------------------
        //              Instance variables
        // ----------------------------------------        
        this.lastAction = null; // Last Action
        this.chain = 0;         // Chain info        
        this.timer = 80 * 1000;     // Timer
        this.isPause = false;


        // ----------------------------------------
        //              Start the game
        // ----------------------------------------        
        this.dealToFoundation();    
        TweenMax.delayedCall(1.75, this.startGame, null, this);
    };

    // ------------------------------------------
    //  showScorePopup
    //  Show popup score effect
    // ------------------------------------------ 
    this.showScorePopup = function(x, y, amount, combo){
        var pool = this.popupPool;
        var popup = this.popupPool.get();
        popup.position.x = x;
        popup.position.y = y;
        popup.setup(amount, combo);
        TweenMax.to(popup.position, 0.5, {
            x: x, y: y - 16 * GAME_SIZE_RATIO,
            ease: Power1.easeOut,
            onComplete:(function()
            {
                TweenMax.delayedCall(0.5, this.parent.remove, [this], this.parent);
            }),
            onCompleteScope:popup
        });
        pool.addChild(popup);
    };

    this.dealToFoundation = function()
    {
        var totalDeck = this.totalDeck;
        var playArea = this.playArea;
        totalDeck.deal(playArea, 28, true, false, false);
        totalDeck.deal(this.foundationDeck, 1, false, false, false);
        totalDeck.activateTopCard();
        playArea.adjustByLayoutInfo();
        for (var i = 0; i < totalDeck.getCards().length; i++) {
            var card = totalDeck.getCards()[i];
            var cardView = card.getView();
            var xPos = totalDeck.getXPosFromIndex(i);            
            TweenMax.to(cardView.position, 0.5, 
                {
                 x: xPos, 
                 y: totalDeck.getY(),
                 delay: 0.01*i
                });            
        };
    };

    this.saveLastAction =  function(action)
    {
        this.lastAction = action;
        this.undoButton.opacity = 1;
    };

    this.undoLastAction = function()
    {        
        var card;
        if(this.lastAction != null)
        {
            if(this.lastAction.type === UNDO_TYPE_PICKUP)
            {
                card = this.lastAction.lastCard;
                this.foundationDeck.remove(card);
                this.playArea.addTop(card);
                card.getView().activateTapEvent(this.playArea.onClickCard);
                for (var i = 0; i < this.lastAction.faceUpCards.length; i++) {
                    var coveredCard = this.lastAction.faceUpCards[i];                 
                    if(coveredCard.canPickUp())
                    {
                        coveredCard.getView().deactivateTapEvent();
                        coveredCard.setFaceUp(false);
                    }                        
                    coveredCard.coveredBy(card);                    
                };
                this.gainScore(-this.lastAction.scoreGain);
                this.decreaseChain();
            }
            else if(this.lastAction.type === UNDO_TYPE_DRAW)
            {
                card = this.foundationDeck.peek();
                this.totalDeck.deactivateTopCard();
                this.foundationDeck.remove(card);
                this.totalDeck.addTop(card);
                this.totalDeck.activateTopCard();
            }
            else if(this.lastAction.type === UNDO_TYPE_TAKE_FROM_RESERVE)
            {
                card = this.foundationDeck.peek();
                var card2 = this.reserveDeck.peek();
                this.foundationDeck.remove(card);
                this.reserveDeck.addTop(card);
                this.reserveDeck.remove(card2);
                this.foundationDeck.addTop(card2);
                card.getView().activateTapEvent(this.reserveDeck.onClickCard);
                card2.getView().deactivateTapEvent();
            }
            else if(this.lastAction.type === UNDO_TYPE_SAVE_TO_RESERVE)
            {                
                if(this.lastAction.drawFromDeck)
                {
                    card = this.foundationDeck.peek();
                    this.totalDeck.deactivateTopCard();
                    this.foundationDeck.remove(card);
                    this.totalDeck.addTop(card);
                    this.totalDeck.activateTopCard();
                }                
                card = this.reserveDeck.peek();
                this.reserveDeck.remove(card);
                this.foundationDeck.addTop(card);
                card.getView().deactivateTapEvent();                
            }
        }
        this.lastAction = null;
        this.undoButton.opacity = 0.5;
    };    

    this.timerCountDown = function(dt)
    {        
        this.timer -= dt;        
        if(this.timer <= 0)
        {
        	
        	BM_API.getAnalytics().eventLevelFailed();
        	
            this.off("onEnterFrame", this.timerCountDown);
            Profile.submitScore(Profile.roundNumber, Profile.score);
            this.showGameOverAnimation(); 
        }
    };
    
    this.__defineGetter__("timer", function(){
            return this._timer;
    });
    
    this.__defineSetter__("timer", function(_time)
    {
        this._timer = Math.max(_time, 0);

        // --- Format as SS ---
        var seconds = Math.floor(this._timer/1000);
        this.timeValueLabel.setText(seconds + '');
    });

    this.startGame = function()
    {
        BannerAd.show(false);
        this.endRoundButton.visible = true;
        this.removeChild(this.blockingClickSprite);
        this.on("onEnterFrame", this.timerCountDown);
    };

    this.endGame = function()
    {        
        this.addChild(this.blockingClickSprite);        
        this.off("onEnterFrame", this.timerCountDown);        
        if(this.playArea.getSize() <= 0)
        {            
            this.showRoundSummary();         
        }else
        {            
            Profile.submitScore(Profile.roundNumber, Profile.score);
            this.showGameOverAnimation();        
        }            
    };

    this.showRoundSummary = function()
    {
    	
    	BM_API.getAnalytics().eventLevelComplete();
    	
        var roundComplete = new RoundSummaryPanel( this.timer, this.totalDeck.getSize(), Profile.roundNumber);
        roundComplete.position.x = SceneManager.instance.bounds().x/2 - roundComplete.bg.width/2;
        roundComplete.position.y = SceneManager.instance.bounds().y/2 - roundComplete.bg.height/2;
        roundComplete.closeButton.sceneGroup = this;
        roundComplete.closeButton.setInteractive(true);
        roundComplete.closeButton.mousedown = roundComplete.closeButton.touchstart = function(event)
        {                               
            BannerAd.show(true);
            this.sceneGroup.goToNextRound(this.parent);
        };
        this.addChild(roundComplete);
        TweenMax.from(roundComplete, 0.5, {scaleX:0, scaleY:0, ease:Back.easeOut});
    };

    this.goToNextRound = function(panel)
    {
        Profile.roundNumber++;        
        var currentScene = SceneManager.instance.currentScene();
        currentScene.removeChild(panel);
        SceneManager.instance.replaceScene(new SceneGame(Profile.roundNumber));        
    };

    this.showGameOverAnimation = function()
    {
        SceneManager.instance.pushScene(new SceneGameOver());
    };

    this.returnToTitle = function()
    {        
        TweenMax.to(this.position, 1, {
            x:SceneManager.instance.bounds().x,
            onComplete: (function(){ 
                var sceneLoading = new SceneLoading(undefined, 'right');
                sceneLoading.position.x = -SceneManager.instance.bounds().x;                       

                SceneManager.instance.replaceScene(sceneLoading);                
                TweenMax.to(sceneLoading.position, 1, {x:0,ease:Power2.easeOut});
            }),
            onCompleteScope:this,
            ease:Power2.easeIn
        }); 
    };

    this.putCardToFront = function (card)
    {
        var cardView = card.getView();
        this.cardsLayer.removeChild(cardView);
        this.cardsLayer.addChild(cardView);
    };

    this.increaseChain = function()
    {
        this.chain += 1;
    };

    this.decreaseChain = function() {
        this.chain -= 1;
        if(this.chain <= 0) this.chain = 0;
    };

    this.resetChain = function()
    {
        this.chain = 0;
    };

    this.calculateScoreGainWithGivenChain = function(baseScore, chain)
    {
        return baseScore * chain;
    };

    this.gainScore = function(score)
    {
        Profile.score += score;
        this.scoreValueLabel.setText(Profile.score + '');
    };

    this.initialize(roundNumber);
};
inheritPrototype(SceneGame, Scene);

// Override update method for Game Scene
SceneGame.prototype.update = function(dt)
{
    Scene.prototype.update.call(this, dt);
    this.trigger("onEnterFrame", dt);
};

// =========================================
//      Tripeak related card stuff func
// =========================================
Tripeak = {};
Tripeak.checkPossibleMove = function(firstCard, secondCard)
{
    var isJoker = firstCard.getRank() === 14 || secondCard.getRank() === 14;
    
    var _deltaRank = Math.abs(firstCard.getRank() - secondCard.getRank());
    var isDifferentByOne = (_deltaRank % 11) == 1;
    
    return isJoker || isDifferentByOne;
};

// =========================================
//      Profile for Game
// =========================================
Profile = {};
Profile.score = 0;

Profile.initializeGame = function()
{
    this.score = 0;
    this.roundNumber = 1;
    this.highscoreEntries = this.initHighScore();
}

Profile.resetGame = function()
{
    this.score = 0;
    this.roundNumber = 1;
}

Profile.initHighScore = function() {
    var highscoreTable;
    var jsonString = localStorage[GAME_UID + "highscoreEntries"];    
    if(jsonString === undefined || jsonString === null)
    {
        highscoreTable = []
        for(var i = 0; i < 8; i++)
        {
            highscoreTable.push(new ScoreEntry(1,0));
        }
    }
    else
        highscoreTable = JSON.parse(jsonString);
    return highscoreTable;
}

Profile.submitScore = function(roundNumber, score)
{
    var pos;
    for(pos = 0; pos < this.highscoreEntries.length; pos++ )
    {
        var oldEntry = this.highscoreEntries[pos];
        if( oldEntry === null || oldEntry.score < score)
            break;
    }
    var newEntry = new ScoreEntry(roundNumber, score);
    this.highscoreEntries.splice(pos, 0, newEntry);
    if(this.highscoreEntries.length > 8 )
        this.highscoreEntries.pop();
    localStorage[GAME_UID + "highscoreEntries"] = JSON.stringify(this.highscoreEntries);
}