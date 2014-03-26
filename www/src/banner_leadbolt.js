// =========================================
//      Banner Ads
// =========================================
BannerAd = {width:320, height:250, id:'banner_sponsor', isEnable:false}

BannerAd.initialize = function(yesOrNo, game)
{
    BannerAd.isEnable = yesOrNo;
    if( yesOrNo )
        this.ads = document.getElementById(this.id);
    else
        this.ads = null;
}

BannerAd.show = function(isVisible)
{    
    if(!BannerAd.isEnable) 
    {
        isVisible = false;
        return;
    }        
    if (isVisible)
        this.ads.style.display = 'block';
    else
        this.ads.style.display = 'none';
}