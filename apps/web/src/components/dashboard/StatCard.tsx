

type StatCardProps ={

    title : string ; 
    value : string ; 
    
};


const StatCard =({

    title , 
    value 
} : StatCardProps) => { // take this two propeties from statsCardprops as title , value from the parent , this file is simple 
 return (
    <div>
        
        <h3>
            {title} 
        </h3>

        <p>
            {value} 
        </p>
    </div>
 );
};

export default StatCard; 