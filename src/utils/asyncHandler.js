//  const asyncHandler=(reqHandler)=>{
//     return (req,res,next)=>{
//         Promise.resolve(reqHandler(req,res,next))
//         .catch((err)=> next(err))
//     }
//  }
  



const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      // centralised error handling - forward to next middleware or send response
      if (next) {
        return next(err);
      }
      res.status(err.code || 500).json({
        success: false,
        message: err.message,
      });
    }
  };
};

export {asyncHandler}