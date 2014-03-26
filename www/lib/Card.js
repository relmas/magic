/**
* This class represents a card.
* A card has an immutable rank and suit
*/
function Card(rank, suit) {
    
        //PRIVATE FIELDS

        var isFaceUp = true;
        var view = null;
        var covered = [];
        var covering = [];
    
	//PUBLIC FUNCTIONS
	
	/**
	* suit getter method
	* returns String suit
	*/
	this.getSuit = function () {
		return suit;
	};

        /**
         * Returns "r" if the card is red (hearts or diamonds) and "s"
         * otherwise.
         */
        this.getColor = function () {
                return (suit == "h" || suit == "d") ? "r" : "s";
        };

        /**
        * Returns whether the card is face up or not.
        */
        this.isFaceUp = function () {
                return isFaceUp;
        };

        /**
        * Sets whether the card is face up--true means it is.
        */
        this.setFaceUp = function (flag) {
            isFaceUp = flag;
            if(view != null)
            {
                view.onFaceChange(isFaceUp);
            }
        };
	
	/**
	* rank getter method
	* returns int rank
	*/
	this.getRank = function () {
		return rank;
	};
	
	/**
	* rank getter method
	* returns String rank
	*/
	this.getRankAsString = function () {
		switch(rank) {
			case 11:
				return "J";
			case 12:
				return "Q";
			case 13:
				return "K";
			case 1:
				return "A";
			default:
				return rank+'';
		}
	};

    this.getRankAndSuitAsString = function() {
        return this.getRankAsString() + this.getSuit();
    }

    this.getView = function() {
        return view;
    };

    this.setView = function(v){
        view = v;
    };

    this.canPickUp = function(){
        return covered.length <= 0;
    };

    this.removeCardOnTop = function(card){
        var index = covered.indexOf(card);
        if(index !== -1)
        {
            covered.splice(index, 1);
            if(covered.length <= 0)
            {
                this.setFaceUp(true);
            }
        }
    };

    this.cover = function (anotherCard) 
    {
        if(covering.indexOf(anotherCard) === -1)
        {
            covering.push(anotherCard);
            anotherCard.coveredBy(this);
        }
    }

    this.coveredBy = function(anotherCard)
    {
        if(covered.indexOf(anotherCard) === -1)
        {
            covered.push(anotherCard);            
        }   
    }

    this.pickUp = function(){
        if(this.canPickUp())
        {
            for (var i = 0; i < covering.length; i++) {
                covering[i].removeCardOnTop(this);
            };
            return true;
        }
        return false;
    };

    this.seeCovered = function(){
        return covered;
    };

    this.seeCovering = function(){
        return covering;
    };
}